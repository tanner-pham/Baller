# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- TypeScript ^5 - All application code (frontend + backend API routes)
- TSX - React components

**Secondary:**
- JavaScript - Legacy backend Supabase client (`backend/supabaseClient.js`)
- SQL - Supabase migrations (`supabase/migrations/202602170001_listing_cache_and_user_history.sql`)
- CSS - Tailwind + custom styles (`src/styles/`)

## Runtime

**Environment:**
- Node.js v23.5.0 (local dev)
- Node.js v20 (CI - specified in `.github/workflows/ci.yml`)

**Package Manager:**
- npm 11.7.0
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.4 - Full-stack React framework (App Router)
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Testing:**
- Jest 30.2.0 - Frontend unit tests (jsdom environment)
- Mocha 11.7.5 - Backend integration tests
- Chai 6.2.2 - Assertion library (backend tests)
- Testing Library React 16.3.2 - Component testing
- Testing Library Jest-DOM 6.9.1 - DOM matchers
- Supertest 7.2.2 - HTTP assertion library (backend)
- Vitest 4.0.18 / @vitest/coverage-v8 4.0.18 - Listed as devDeps but Jest is the active runner

**Build/Dev:**
- Turbopack - Dev server bundler (configured in `next.config.ts`)
- ts-jest 29.4.6 - TypeScript transform for Jest
- tsx 4.21.0 - TypeScript execution for Mocha backend tests
- ts-node 10.9.2 - TypeScript execution
- ESLint 9 + eslint-config-next 16.1.4 - Linting (`eslint.config.mjs`)
- PostCSS with @tailwindcss/postcss plugin (`postcss.config.mjs`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.95.3 - Database, auth, and caching (used in both browser and server contexts)
- `openai` ^6.22.0 - GPT-4o-mini for condition assessment (`src/app/api/assess-condition/route.ts`)
- `playwright-core` ^1.58.2 - Facebook Marketplace scraping via browser automation (`src/lib/server/facebookMarketplaceHtmlFetcher.ts`)

**Infrastructure:**
- `dotenv` ^17.2.4 - Environment variable loading
- `next` 16.1.4 - App framework and API routing

**UI:**
- `lucide-react` ^0.563.0 - Icon library (used throughout components)
- `tailwindcss` ^4 - Utility-first CSS framework

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to project root (`@/src/lib/...` etc.)
- JSX: react-jsx (automatic runtime)

**Next.js:**
- Config: `next.config.ts`
- Turbopack enabled for dev
- `serverExternalPackages`: `playwright-core`, `@sparticuz/chromium-min` (excluded from bundling)
- Environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` exposed to client via `env` config

**ESLint:**
- Config: `eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores `.next/`, `out/`, `build/`, `coverage/`

**Jest:**
- Config: `jest.config.ts`
- Single project "frontend" with jsdom environment
- Test match: `tests/frontend/**/*.test.{ts,tsx}`
- Module name mapper: `@/*` to `<rootDir>/*`
- Coverage from: `src/**/*.{ts,tsx}`
- Setup file: `jest.setup.ts`

**Tailwind CSS v4:**
- Config: `src/styles/tailwind.css` (uses `@import 'tailwindcss'` with source directive)
- Custom neo-brutalist utilities: `border-5`, `text-shadow-neo`, `shadow-brutal`, `shadow-brutal-sm`, `shadow-brutal-lg`
- PostCSS plugin: `@tailwindcss/postcss`

**Environment:**
- `.env` file present (not committed)
- `.env.example` documents required vars:
  - `SUPABASE_URL` - Supabase project URL
  - `SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
  - `OPENAI_API_KEY` - OpenAI API key for condition assessment
  - `MARKETPLACE_HTML_FETCH_MODE` - Scraper transport mode (`playwright`, `http`, etc.)
  - `MARKETPLACE_PLAYWRIGHT_*` - Playwright configuration options
  - `BROWSERLESS_WS_URL` - Remote Browserless WebSocket URL
  - `FACEBOOK_COOKIE_HEADER` - Facebook session cookies for HTTP scraping
  - `FACEBOOK_PLAYWRIGHT_STORAGE_STATE_B64` - Playwright session state
  - `MARKETPLACE_HTML_TIMEOUT_MS` - Scraping timeout

## Build & Run Commands

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test          # Jest frontend tests with coverage
npm run test:backend  # Mocha backend tests (requires tsx)
npm run test:all      # Run both test suites
```

## Platform Requirements

**Development:**
- Node.js >= 20
- npm
- Playwright Chromium browser (for Marketplace scraping)
- Supabase project (or local Supabase CLI - `supabase/config.toml` present)

**Production:**
- Node.js runtime (Next.js server)
- Supabase hosted project (PostgreSQL + Auth)
- OpenAI API access
- Playwright-compatible environment or Browserless service

**CI:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Two parallel jobs: `frontend-tests` (Jest + ESLint) and `backend-tests` (Mocha)
- Node.js 20, npm caching enabled
- Backend tests require `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets

---

*Stack analysis: 2026-03-05*
