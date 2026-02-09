# Landing Page: Current State

Last updated: 2026-02-09

## Overview
This document captures the current implementation state of the landing page for Baller, how it is organized, what is working, and what is intentionally still placeholder.

## Tech Stack
- Next.js App Router (`next@16.1.4`)
- React (`react@19.2.3`)
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- TypeScript
- `lucide-react` for icons

## Routing and File Organization
- Landing route: `src/app/page.tsx` (`/`)
- Dashboard route: `src/app/dashboard/page.tsx` (`/dashboard`) currently placeholder
- Root layout: `src/app/layout.tsx`
- Landing sections are split into route-grouped components in `src/app/(components)/`
- Style files are centralized under `src/styles/`

Current landing composition in `src/app/page.tsx`:
- `Navigation`
- `Hero`
- `HowItWorks`
- `Features`
- `FinalCTA`
- `Footer`

## Section-Level Status

### Navigation (`src/app/(components)/Navigation.tsx`)
- Brand label ("BALLER")
- Dashboard link to `/dashboard`

### Hero (`src/app/(components)/Hero.tsx`)
- URL input field
- "Analyze Now" button
- Uses client-side state
- Current action is placeholder (`alert(...)`)

### How It Works (`src/app/(components)/HowItWorks.tsx`)
- 3-step explanation cards
- Section anchor id: `#how-it-works`

### Features (`src/app/(components)/Features.tsx`)
- Feature cards and iconography
- Section anchor id: `#features`

### Final CTA (`src/app/(components)/FinalCTA.tsx`)
- Primary and secondary CTA buttons
- Section anchor id: `#learn-more`
- Buttons currently render as visual placeholders (no wired action)

### Footer (`src/app/(components)/Footer.tsx`)
- Product anchor links:
  - `#how-it-works`
  - `#features`
  - `#learn-more`
- External resource links:
  - Living document (Google Doc)
  - GitHub repository

## Styling System
- Global styles are loaded via `src/app/layout.tsx` -> `src/app/globals.css`
- `src/app/globals.css` imports:
  - `src/styles/fonts.css`
  - `src/styles/tailwind.css`
  - `src/styles/theme.css`
- Utility classes and component styling are mostly applied directly in JSX
- Color usage currently relies on hardcoded hex values in class names and inline styles

## Known Deficiencies (Current, Intentional)
- Most buttons link to nothing at the moment; they are placeholders for now.
- Background assets are not imported from Figma yet; solid colors are used for now.

## Additional Gaps and Risks
- CTA behavior is inconsistent:
  - Some links are wired (footer anchors, external resources, dashboard nav)
  - Some are visual-only (Final CTA buttons)
- Hero submission is mock behavior only (alert), not connected to backend/API.
- `/dashboard` exists but is still placeholder content.
- No analytics/event tracking yet for key CTA interactions.

## Recommended Next Steps
1. Wire all CTA buttons to intended routes or actions.
2. Replace solid-color backgrounds with exported Figma assets/tokens.
3. Connect Hero analyze flow to a real API route and result page.
4. Define a shared design token strategy (colors, spacing, typography) to reduce hardcoded values.
5. Add basic tracking (clicks, conversions, section engagement).

## Quick Validation Checklist
- `npm run lint` passes
- `npx tsc --noEmit` passes
- Verify footer anchors scroll correctly
- Verify external links open in new tabs
- Verify `/dashboard` navigation works
