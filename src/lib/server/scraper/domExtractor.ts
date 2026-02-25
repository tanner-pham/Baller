import type { Page } from 'playwright-core';
import type { ScrapedListingDetails, ScrapedComparable } from './types';

function extractListingId(url: string): string {
  const match = url.match(/\/item\/(\d+)/);
  return match?.[1] ?? Date.now().toString();
}

/**
 * Normalize raw condition text from the DOM into the enum values the frontend expects.
 * Ported from parseHtml.ts normalizeConditionValue().
 */
function normalizeConditionValue(raw: string): string {
  const n = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!n) return '';
  if (n === 'new') return 'new';
  if (n === 'used_like_new' || n.includes('like new')) return 'used_like_new';
  if (n === 'used_good' || n.endsWith('good') || n.includes('used good')) return 'used_good';
  if (n === 'used_fair' || n.endsWith('fair') || n.includes('used fair')) return 'used_fair';
  if (n === 'used' || n.endsWith('acceptable') || n.includes('used acceptable')) return 'used_good';
  return '';
}

export interface EmbeddedJsonData {
  location: string;
  locationId: string;
  creationTime: number | null;
}

/**
 * Extract location, location ID, and creation timestamp from Facebook's embedded script JSON.
 *
 * Facebook embeds the listing's full data in a <script> tag as JSON. The listing
 * object contains these three fields in sequence:
 *   "creation_time": <unix timestamp>,
 *   "location_text": { "text": "City, ST" },
 *   "location_vanity_or_id": "<numeric id>"
 *
 * Capturing all three with one regex avoids rescanning the scripts.
 * The location ID is used to scope the comparable search to the same city.
 */
export async function extractFromEmbeddedJson(
  page: Page,
  listingId: string,
): Promise<EmbeddedJsonData> {
  // The og:title meta (in <head>) arrives well before the inline JSON data, which
  // Facebook injects near the bottom of the HTML body. Wait for the specific
  // pattern to appear in the scripts before extracting to avoid a race condition.
  await page
    .waitForFunction(
      (id) => {
        for (const s of document.querySelectorAll('script')) {
          const t = s.textContent ?? '';
          if (t.includes(id) && t.includes('"location_vanity_or_id"')) return true;
        }
        return false;
      },
      listingId,
      { timeout: 6000 },
    )
    .catch(() => undefined);

  return page.evaluate((id) => {
    for (const s of document.querySelectorAll('script')) {
      const text = s.textContent ?? '';
      if (!text.includes(id)) continue;

      const m = text.match(/"creation_time":(\d+),"location_text":\{"text":"([^"]+)"\},"location_vanity_or_id":"([^"]+)"/);
      if (m) {
        return { creationTime: parseInt(m[1]), location: m[2], locationId: m[3] };
      }
    }
    return { location: '', locationId: '', creationTime: null };
  }, listingId);
}

/**
 * Grab title ASAP — uses og:title meta tag (available in <head> before React hydrates),
 * falls back to h1 after hydration.
 *
 * Ported from tanner-scrapper/src/scraper.ts extractTitleFast().
 */
export async function extractTitleFast(page: Page): Promise<string> {
  await page
    .waitForFunction(
      () => {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta && meta.getAttribute('content')) return true;
        if (document.querySelector('h1')) return true;
        return false;
      },
      { timeout: 6000 },
    )
    .catch(() => undefined);

  const title: string = await page.evaluate(`
    (() => {
      const meta = document.querySelector('meta[property="og:title"]');
      const ogTitle = meta?.getAttribute('content')?.trim() ?? '';
      if (ogTitle) return ogTitle;
      const h1 = document.querySelector('h1');
      return h1?.textContent?.trim() ?? '';
    })()
  `);

  return title;
}

/**
 * Extract full listing details from a rendered listing page.
 *
 * Location and date come from Facebook's embedded script JSON (most reliable).
 * Seller name comes from DOM profile links (requires authenticated session).
 * Falls back to DOM extraction for location if JSON extraction fails.
 *
 * Pass `prefetchedJson` when the caller has already called extractFromEmbeddedJson
 * (e.g. to get the locationId for the search URL) to avoid rescanning the scripts.
 */
export async function extractListingFull(
  page: Page,
  url: string,
  listingId: string | null,
  prefetchedJson?: EmbeddedJsonData,
): Promise<ScrapedListingDetails> {
  // Wait for h1 + price to appear (React hydration indicator)
  await page
    .waitForFunction(
      () => {
        const h1 = document.querySelector('h1');
        if (!h1) return false;
        const parent = h1.closest('div');
        if (!parent) return false;
        const spans = parent.parentElement?.querySelectorAll('span') ?? [];
        for (const s of spans) {
          if (/^\$[\d,]+(\.\d{2})?$/.test(s.textContent?.trim() ?? '')) return true;
        }
        return false;
      },
      { timeout: 4000 },
    )
    .catch(() => undefined);

  // Use pre-fetched JSON data if provided, otherwise extract now
  const jsonData = prefetchedJson
    ?? (listingId ? await extractFromEmbeddedJson(page, listingId) : null);

  const listingDate = jsonData?.creationTime
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(jsonData.creationTime * 1000))
    : '';

  const details = await page.evaluate(`
    (() => {
      let title = '';
      const h1 = document.querySelector('h1');
      if (h1) title = h1.textContent?.trim() ?? '';
      else {
        const mt = document.querySelector('meta[property="og:title"]');
        title = mt?.getAttribute('content') ?? '';
      }

      let price = '';
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        const t = s.textContent?.trim() ?? '';
        if (/^\\$[\\d,]+(\\.[\\d]{2})?$/.test(t)) { price = t; break; }
      }

      let description = '';
      for (const el of document.querySelectorAll('span[dir="auto"]')) {
        const t = el.textContent?.trim() ?? '';
        if (t.length > 50 && t !== title && !t.includes(price)) { description = t; break; }
      }

      // Location: primary is the anchor link inside "Listed X ago in [City, ST]".
      // Facebook renders this as <span>Listed <abbr>X ago</abbr> in <a>City, ST</a></span>,
      // so the link text is the clean "City, ST" value with no extra noise.
      let location = '';
      for (const s of document.querySelectorAll('span')) {
        if (!/Listed\\s+.+\\s+in\\s+/i.test(s.textContent?.trim() ?? '')) continue;
        const link = s.querySelector('a[href*="/marketplace/"]');
        if (link) { location = link.textContent?.trim() ?? ''; break; }
      }
      // Fallback: span starting with explicit prefix
      if (!location) {
        for (const s of spans) {
          const t = s.textContent?.trim() ?? '';
          if (t.startsWith('Listed in') || t.startsWith('Available in')) { location = t; break; }
        }
      }

      let condition = '';
      for (const s of spans) {
        const t = s.textContent?.trim().toLowerCase() ?? '';
        if (['new','used - like new','used - good','used - fair','used'].includes(t)) {
          condition = s.textContent?.trim() ?? ''; break;
        }
      }

      // Seller name: only populated when the session is authenticated.
      // Facebook exposes seller profile links under /marketplace/profile/ or /user/.
      let sellerName = '';
      for (const a of document.querySelectorAll('a[href*="/marketplace/profile/"], a[href*="/user/"]')) {
        const t = a.textContent?.trim() ?? '';
        if (t.length > 1 && t.length < 60 && !/log in|sign up/i.test(t)
            && !t.includes('Marketplace') && !t.includes('Facebook')) {
          sellerName = t; break;
        }
      }

      const imageUrls = [];
      for (const img of document.querySelectorAll('img[src*="scontent"], img[src*="fbcdn"]')) {
        const src = img.getAttribute('src');
        if (!src || imageUrls.includes(src)) continue;
        if (src.includes('emoji') || src.includes('avatar') || src.includes('profile')) continue;
        if (src.includes('/p50x50/') || src.includes('/s50x50/') || src.includes('/c32.')) continue;
        imageUrls.push(src);
      }

      return { title, price, description, location, condition, sellerName, imageUrls };
    })()
  `) as {
    title: string;
    price: string;
    description: string;
    location: string;
    condition: string;
    sellerName: string;
    imageUrls: string[];
  };

  return {
    id: extractListingId(url),
    url,
    title: details.title,
    price: details.price,
    description: details.description,
    // JSON source wins for location (clean "City, ST"); DOM is the fallback
    location: jsonData?.location || details.location,
    condition: normalizeConditionValue(details.condition),
    sellerName: details.sellerName,
    listingDate,
    imageUrls: details.imageUrls,
  };
}

/**
 * Extract comparable listings from a marketplace search results page.
 *
 * Ported from tanner-scrapper/src/scraper.ts extractSearchResults()
 * with addition: location extraction from search cards.
 */
export async function extractSearchResults(page: Page): Promise<ScrapedComparable[]> {
  try {
    await page.waitForSelector('a[href*="/marketplace/item/"]', { timeout: 5000 });
  } catch {
    // No results — return empty
  }

  const comparables = (await page.evaluate(`
    (() => {
      const results = [];
      for (const link of document.querySelectorAll('a[href*="/marketplace/item/"]')) {
        const href = link.getAttribute('href') ?? '';
        const fullUrl = href.startsWith('/') ? 'https://www.facebook.com' + href : href;

        let title = '', price = '', location = '';
        for (const span of link.querySelectorAll('span')) {
          const t = span.textContent?.trim() ?? '';
          if (!t) continue;
          if (/^\\$[\\d,]+(\\.[\\d]{2})?$/.test(t)) { if (!price) price = t; }
          else if (t.length > 2 && t.length < 150 && !title && !/^\\$/.test(t)) { title = t; }
          else if (!location && t.length < 80 && t !== title && !/^\\$/.test(t)
                   && (t.includes(',') || /\\b(?:mi|miles|km)\\b/i.test(t))) {
            location = t;
          }
        }

        const img = link.querySelector('img');
        const imageUrl = img?.getAttribute('src') ?? '';

        if (title && price && !results.some(r => r.url === fullUrl)) {
          results.push({ title, price, imageUrl, url: fullUrl, location });
        }
      }
      return results;
    })()
  `)) as ScrapedComparable[];

  return comparables;
}
