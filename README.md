# Baller

Baller is a Next.js app that helps users evaluate Facebook Marketplace listings with pricing context and AI-assisted condition insights.

## Jump to
- [Beta Release](#beta-release-(v0.1.0))
- [Gamma Release](#gamma-release-(v0.2.0))
- [Final Release](#final-release-(v0.3.0))
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Layout](#project-layout)
- [Quick Start](#quick-start)
- [Documentation](#where-to-go-next)
- [Project Document](#living-document)

## Final Release (v0.3.0)
**Git Tag:** `final-release`

### What's New Since Gamma
*UNSURE WHAT ALL THE NEW FEATURES ARE*

---

## Gamma Release (v0.2.0)
**Git Tag:** `gamma-release`

### What's New Since Beta

The gamma release brings a major backend overhaul and a round of dashboard UX improvements built on top of the beta foundation.

**Scraping & Data Pipeline**
- Replaced the RapidAPI-based listing retrieval with direct HTML scraping using Playwright, cutting load times and removing the external API dependency.
- Added a full Playwright-based scraper (`src/lib/server/scraper/`) that runs two browser tabs in parallel — one for the listing page, one for a location-scoped comparable search.
- Built a robust HTML parser (`parseHtml.ts`) with JSON-from-script extraction, DOM fallback, and gallery image collection. Handles Facebook auth walls, login modals, and edge cases gracefully.
- Introduced `@sparticuz/chromium-min` for Vercel/Lambda compatibility so the scraper works in serverless environments.
- Added cookie and Playwright storage-state injection for authenticated Marketplace sessions.

**Dashboard UX**
- Unauthed users are now prompted with a sign-in popup when they try to search another listing, instead of silently failing.
- Previous Listings section is hidden entirely for guests — only authenticated users see their history.
- Previous Listings now scrolls horizontally (all entries, not capped at 4) with a scroll indicator so users know there's more to see.
- Removed the sidebar hamburger button. Logout now lives directly in the header next to the search bar.
- Market Value is now computed as the average of the current listing price and all similar listing prices, rather than just echoing the ask price.
- Fixed similar listings not rendering — added a fallback that maps `simpleListings` (string prices) into the `SimilarListing` format (numeric prices) when the scraper's `similarListings` array is empty.
- Added video-primary-image detection: if the first image URL looks like a video (`/v/`, `.mp4`, etc.), the display falls back to the next available photo.
- Fixed listing card images not filling their containers (`w-full h-full object-cover`).

**Infrastructure & Testing**
- Reorganized tests into `tests/frontend/` and `tests/backend/` directories.
- Added frontend tests for the SimilarListings component (100% coverage).
- Added backend tests for the HTML parser and URL parsing utilities.

---

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
2. System fetches and parses listing HTML from Facebook Marketplace
3. Backend calls GPT-4o-mini to assess item condition from images (0.0-1.0 score)
4. Dashboard displays condition badge, pricing analysis, and similar listings
5. Results are cached for 48 hours to reduce API costs

**Components Tested:**
- Frontend (Next.js dashboard UI)
- Backend API (`/api/assess-condition`, `/api/marketplace-listing`, `/api/simple-listings`)
- Database (Supabase caching layer)
- External APIs (OpenAI GPT-4o-mini)
- CI/CD (GitHub Actions with Jest + Mocha)

---

## Core Features

- Parse and normalize Facebook Marketplace listing URLs.
- Fetch listing details from listing-page HTML (`/api/marketplace-listing`).
- Fetch simple similar listings from search-page HTML (`/api/simple-listings`).
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
- OpenAI SDK (GPT-4o-mini vision)
- Playwright + Chromium (Marketplace scraper)
- Jest (frontend tests) + Mocha/Chai (backend tests)

## Project Layout

- `src/` frontend UI, routing, utilities
- `backend/` backend helper modules
- `tests/` jest + mocha/chai tests
For a detailed directory structure, see [CONTRIBUTING.md](docs/CONTRIBUTING.md#architecture-overview)

## Quick Start

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
   
## Environment Variables

1. Copy `.env.example` to `.env.local`.
2. Configure at least:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
(For full environment variable documentation, see [CONTRIBUTING.md](docs/CONTRIBUTING.md#environment-variables))

   **Getting API Keys:**
   - Supabase: https://supabase.com/dashboard (create project → Settings → API)
   - OpenAI: https://platform.openai.com/api-keys

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

## Running the System

### Local Development
```bash
npm ci
npm run dev
```
Then navigate to:
- Landing page: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Auth: http://localhost:3000/auth

## Auth Flow

- `/auth` supports sign up and login.
- Authenticated users are redirected to `/dashboard`.
- Guests can preview listing analysis on `/dashboard`.
- Login is required for authenticated-only dashboard features such as search history.

## Where to go Next
- User Guide - [USER_GUIDE.md](docs/USER_GUIDE.md)
- Developer Guide - [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Living Document

- [Baller Living Document](https://docs.google.com/document/d/1Ne9dMbzxdo1actxRgpeopU2VFmHr2Dr3ZVr-e0mSXKc/edit?usp=sharing)
