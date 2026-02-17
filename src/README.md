# `src` Code Map

This folder contains all frontend runtime code for the Next.js App Router project, plus shared browser/server utilities and types.

## Folder Overview

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router routes, route handlers, and UI components. |
| `src/lib/` | Shared non-UI utilities (auth session hook, Supabase clients, URL parsing). |
| `src/styles/` | Global CSS, Tailwind setup, and style utilities. |
| `src/types/` | Shared TypeScript type declarations used across route handlers and UI. |

## Architecture Notes

- Route handlers live in `src/app/api/...` and are consumed by dashboard hooks.
- Dashboard page logic is split into hooks/utilities under `src/app/dashboard/`.
- Client auth/session state is centralized by `src/lib/auth/useAuthSession.ts`.
- Style constants intended for future consolidation are maintained in `src/app/consts.ts`.

## See Also

- `src/app/README.md`
- `src/lib/README.md`
- `src/styles/README.md`
- `src/types/README.md`
