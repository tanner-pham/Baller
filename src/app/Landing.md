# Landing Page: Current State

Last updated: 2026-02-17

## Overview

This document captures the current landing page implementation and how it connects to dashboard analysis flow.

## Active Landing Flow

1. User opens `/`.
2. `Hero` accepts a Facebook Marketplace URL.
3. URL is normalized by `parseFacebookMarketplaceListingUrl`.
4. User is routed to `/dashboard?listingUrl=...&itemId=...`.

## Route and Component Structure

- Route entry: `src/app/page.tsx`
- Navigation: `src/app/(components)/Navigation.tsx`
- Hero input/CTA: `src/app/(components)/Hero.tsx`
- Marketing sections:
  - `src/app/(components)/HowItWorks.tsx`
  - `src/app/(components)/Features.tsx`
  - `src/app/(components)/FinalCTA.tsx`
- Footer/resources: `src/app/(components)/Footer.tsx`

## Styling Notes

- Global CSS is imported in `src/app/globals.css`.
- Core style sources:
  - `src/styles/fonts.css`
  - `src/styles/tailwind.css`
  - `src/styles/theme.css`
  - `src/styles/similarListings.css`
- Shared future style constants are retained in `src/app/consts.ts`.

## Auth and Navigation Behavior

- Auth/session state is driven by `src/lib/auth/useAuthSession.ts`.
- Navigation conditionally renders auth actions and dashboard controls.
- Dashboard entry remains available from the top nav and hero action.
- Dashboard supports guest preview for listing analysis.
- Login is required for account-specific history features.

## Validation Checklist

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:all`
