# Baller

Baller is a Next.js app that helps users evaluate Facebook Marketplace listings with pricing context and AI-assisted condition insights.

## Core Features

- Parse and normalize Facebook Marketplace listing URLs.
- Fetch listing details from RapidAPI (`/api/marketplace-listing`).
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

1. Copy `.env.example` to `.env.local`.
2. Configure:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `OPENAI_API_KEY`
   - `RAPIDAPI_KEY`
   - `RAPIDAPI_HOST` (optional, defaults to `facebook-marketplace1.p.rapidapi.com`)

## Local Development

```bash
npm ci
npm run dev
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
