# `backend` Code Map

Backend-support modules and backend-oriented tests.

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `backend/supabaseClient.js` | Shared Supabase anon client singleton for backend-side helper usage/tests. | `getSupabaseClient` | `@supabase/supabase-js`, environment variables |
| `backend/supabaseClient.test.ts` | Mocha/Chai tests for Supabase env/config assumptions. | tests only | mocha/chai |

## Notes

- Route handlers inside `src/app/api` are the primary API surface.
- Backend tests are run by `npm run test:backend`.
