# Baller

Baller is a Next.js app that helps users evaluate Facebook Marketplace listings with pricing context and AI-assisted condition insights.

## Beta Release (v0.1.0)

**Git Tag:** `beta-release`

### Operational Use Case

**Use Case: Condition Assessment and Pricing Analysis**

Users can analyze Facebook Marketplace listings to receive:
- AI-powered condition assessment (GPT-4o-mini vision analysis)
- Pricing recommendations based on condition scoring
- Dashboard view with pricing rationale and negotiation tips

**How it works:**
1. User navigates to `/dashboard`
2. System fetches listing data from either internal scraper service or RapidAPI fallback (`SCRAPER_PROVIDER`)
3. Backend calls GPT-4o-mini to assess item condition from images (0.0-1.0 score)
4. Dashboard displays condition badge, pricing analysis, and similar listings
5. Results are cached for 48 hours to reduce API costs

**Components Tested:**
- Frontend (Next.js dashboard UI)
- Backend API (`/api/assess-condition`, `/api/marketplace-listing`, `/api/similar-listings`)
- Database (Supabase caching + async similar-listing job layer)
- External APIs (OpenAI GPT-4o-mini, internal scraper service, RapidAPI fallback)
- CI/CD (GitHub Actions with Jest + Mocha)

## Core Features

- Parse and normalize Facebook Marketplace listing URLs.
- Fetch listing details from internal scraper service with RapidAPI fallback (`/api/marketplace-listing`).
- Fetch async similar-listings status/payload (`/api/similar-listings`).
- Run condition assessment with OpenAI (`/api/assess-condition`).
- Show pricing rationale, negotiation guidance, and similar listings in `/dashboard`.
- Reuse listing/condition computations with a 48-hour shared DB cache.
- Persist authenticated user listing history in Supabase for cross-device access.
- Authenticate users with Supabase email/password auth.

## Tech Stack

- Next.js App Router (`next@16`)
- React (`react@19`)
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js`)
- OpenAI SDK
- Jest + Mocha/Chai test split

## Project Layout

- `src/app/` routes, UI components, and route handlers
- `src/lib/` shared utilities and auth/session hook
- `src/types/` shared external payload typing
- `src/styles/` global CSS and theme utilities
- `backend/` backend helper modules/tests

See folder-level docs for file-by-file maps:

- `src/README.md`
- `src/app/README.md`
- `src/lib/README.md`
- `src/styles/README.md`
- `src/types/README.md`
- `backend/README.md`

## Environment Setup

### Prerequisites
- Node.js v20 or higher
- npm v10 or higher
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tanner-pham/Baller.git
   cd Baller
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Then configure the following required variables in `.env.local`:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
   - `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini
   - `SCRAPER_PROVIDER` - `internal` or `rapidapi` (defaults to `rapidapi`)
   - `SCRAPER_BASE_URL` - internal scraper service base URL (required when `SCRAPER_PROVIDER=internal`)
   - `SCRAPER_INTERNAL_TOKEN` - shared bearer token for internal scraper calls
   - `SIMILAR_CACHE_TTL_HOURS` - (optional, defaults to `12`)
   - `RAPIDAPI_KEY` - RapidAPI key for fallback mode
   - `RAPIDAPI_HOST` - (optional, defaults to `facebook-marketplace1.p.rapidapi.com`)

   **Getting API Keys:**
   - Supabase: https://supabase.com/dashboard (create project → Settings → API)
   - OpenAI: https://platform.openai.com/api-keys
   - RapidAPI (fallback): https://rapidapi.com/datacrawler/api/facebook-marketplace1

## Building the System

### Development Build
```bash
npm run dev
```
The app will be available at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

## Testing the System

### Run All Tests
```bash
npm run test:all
```

### Frontend Tests Only (Jest)
```bash
npm test
```
- Runs Jest tests with coverage reporting
- Coverage threshold: 80% (configured in `jest.config.ts`)
- Tests UI components using React Testing Library

### Backend Tests Only (Mocha + Chai)
```bash
npm run test:backend
```
- Runs Mocha/Chai tests for API routes and backend logic
- Tests condition assessment API mocking
- Tests Supabase client configuration

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Test Coverage
Coverage reports are automatically generated when running `npm test`. View detailed coverage at `coverage/lcov-report/index.html` after running tests.

## Running the System

### Local Development
```bash
npm run dev
```
Then navigate to:
- Landing page: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Auth: http://localhost:3000/auth

### Running with Mock Data
The dashboard works with placeholder data if you don't have all API keys configured. To test the full flow:
1. Set up all environment variables (see Environment Setup)
2. Run `npm run dev`
3. Navigate to `/dashboard`
4. The system will automatically fetch and analyze a demo listing

### Continuous Integration
Tests run automatically on:
- Every push to any branch
- Every pull request to `main`
- View CI status: https://github.com/tanner-pham/Baller/actions

## Environment Setup

1. Copy `.env.example` to `.env.local`.
2. Configure:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `OPENAI_API_KEY`
   - `SCRAPER_PROVIDER`
   - `SCRAPER_BASE_URL` and `SCRAPER_INTERNAL_TOKEN` (for internal scraper mode)
   - `SIMILAR_CACHE_TTL_HOURS` (optional)
   - `RAPIDAPI_KEY` and `RAPIDAPI_HOST` (for fallback mode)

## Local Development

```bash
npm ci
npm run dev
```

### Internal Scraper Service (Optional for `SCRAPER_PROVIDER=internal`)

```bash
cd services/scraper
npm install
npm run api
```

In a second terminal:

```bash
cd services/scraper
npm run worker
```

## Quality and Test Commands

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run test:backend
npm run test:all
```

## Auth Flow

- `/auth` supports sign up and login.
- Authenticated users are redirected to `/dashboard`.
- Guests can preview listing analysis on `/dashboard`.
- Login is required for authenticated-only dashboard features such as search history.

## Living Document

- [Baller Living Document](https://docs.google.com/document/d/1Ne9dMbzxdo1actxRgpeopU2VFmHr2Dr3ZVr-e0mSXKc/edit?usp=sharing)
