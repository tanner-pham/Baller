import { chromium, type BrowserContext, type Page } from 'playwright-core';
import * as path from 'path';

const BROWSER_DATA_DIR = path.resolve(
  process.env.MARKETPLACE_PLAYWRIGHT_USER_DATA_DIR ?? '.browser-data'
);
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const BLOCKED_RESOURCES = [
  '**/tr/**',
  '**/logging/**',
  '**/ajax/bz**',
  '**google-analytics**',
  '**googletagmanager**',
  '**doubleclick**',
];

const AUTO_DISMISS_SCRIPT = `
  (() => {
    const SELECTORS = [
      '[role="dialog"] [aria-label="Close"]',
      '[data-cookiebanner="accept_button"]',
      '[aria-label="Not now"]',
      '[aria-label="Decline optional cookies"]',
    ];
    function tryDismiss() {
      for (const sel of SELECTORS) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
      }
    }
    tryDismiss();
    if (document.body) {
      new MutationObserver(tryDismiss).observe(document.body, { childList: true, subtree: true });
    }
  })()
`;

export class MarketplaceHtmlError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status = 502, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// --------------- singleton state ---------------

let contextInstance: BrowserContext | null = null;
let idleTimer: NodeJS.Timeout | null = null;
let launching: Promise<BrowserContext> | null = null;

function resetIdleTimer(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (contextInstance) {
      console.info('[browserManager] Idle timeout — closing browser context');
      await contextInstance.close().catch(() => undefined);
      contextInstance = null;
    }
  }, IDLE_TIMEOUT_MS);
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseCookieHeaderToContextCookies(
  cookieHeader: string,
): Array<{ name: string; value: string; url: string }> {
  return cookieHeader
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf('=');
      if (idx <= 0) return null;
      const name = entry.slice(0, idx).trim();
      const value = entry.slice(idx + 1).trim();
      if (!name || value.length === 0) return null;
      return { name, value, url: 'https://www.facebook.com' };
    })
    .filter((c): c is { name: string; value: string; url: string } => c !== null);
}

async function addCookiesFromEnv(context: BrowserContext): Promise<void> {
  const cookieHeader = normalizeEnvValue(process.env.FACEBOOK_COOKIE_HEADER);
  if (!cookieHeader) return;
  const parsed = parseCookieHeaderToContextCookies(cookieHeader);
  if (parsed.length > 0) {
    await context.addCookies(parsed);
  }
}

async function launchContext(): Promise<BrowserContext> {
  console.info('[browserManager] Launching persistent browser context…');

  const executablePath = normalizeEnvValue(process.env.MARKETPLACE_PLAYWRIGHT_EXECUTABLE_PATH);
  const channelEnv = normalizeEnvValue(process.env.MARKETPLACE_PLAYWRIGHT_CHANNEL);
  const channel = channelEnv?.toLowerCase() === 'none' ? undefined : channelEnv;

  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: true,
    ...(executablePath ? { executablePath } : channel ? { channel } : {}),
    viewport: { width: 1280, height: 800 },
    userAgent: DEFAULT_USER_AGENT,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',
      '--no-sandbox',
    ],
    bypassCSP: true,
  });

  await addCookiesFromEnv(context);
  console.info('[browserManager] Browser context ready');
  return context;
}

// --------------- public API ---------------

export async function acquireBrowserContext(): Promise<BrowserContext> {
  resetIdleTimer();

  if (contextInstance) return contextInstance;

  // Prevent parallel launches
  if (!launching) {
    launching = launchContext().then((ctx) => {
      contextInstance = ctx;
      launching = null;
      return ctx;
    });
  }

  return launching;
}

export async function createConfiguredPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  for (const pattern of BLOCKED_RESOURCES) {
    await page.route(pattern, (route) => route.abort()).catch(() => undefined);
  }

  page.on('domcontentloaded', async () => {
    page.evaluate(AUTO_DISMISS_SCRIPT).catch(() => undefined);
  });

  return page;
}

export async function shutdownBrowser(): Promise<void> {
  if (idleTimer) clearTimeout(idleTimer);
  if (contextInstance) {
    await contextInstance.close().catch(() => undefined);
    contextInstance = null;
  }
}

/**
 * Detect auth wall from page HTML content.
 * Ported from parseHtml.ts looksLikeFacebookAuthWall().
 */
export function looksLikeFacebookAuthWall(html: string): boolean {
  const lower = html.toLowerCase();
  const hasLoginForm =
    lower.includes('id="login_form"') ||
    lower.includes('name="login"') ||
    (lower.includes('name="email"') && lower.includes('name="pass"'));
  const hasLoginRedirect =
    lower.includes('/login/?next=') || lower.includes('/login/device-based/');
  const hasExplicitAuthMessage =
    lower.includes('you must log in to continue') ||
    lower.includes('please log in to continue');
  return hasLoginForm || hasLoginRedirect || hasExplicitAuthMessage;
}
