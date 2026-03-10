# Developer Guidelines
Welcome, and thank you for you interesting in contributing! This developer guide describes how to contribute to **Baller**.
This document focuses on internal development practices, architecture, and contribution workflow.

For quick start setup, see the [top-level README](../README.md).

## Obtaining the source code
```bash
   git clone https://github.com/tanner-pham/Baller.git
   cd Baller
   npm ci
   ```

## Architecture Overview
A develop-focused overview (see folder-level READMEs for detail):

### Repository Layout (visual structure)
```
├── src/  
│ ├── app/ # Next.js routes and API route handlers  
│ ├── lib/ # Shared utilities and Supabase client  
│ ├── types/ # Shared TypeScript types  
│ └── styles/ # Global styles  
├── backend/  
│ └── supabase / # Supabase client configuration
├── tests/
│ └── frontend / # Jest + React Testing Library
│ └── backend / # Mocha/Chai API + scraper tests
├── docs/ # User and Developer documentation  
└── README.md # Setup and general overview
```

### Directory Responsibilities
- `src/` contains the frontend and API interface layer.  
- `backend/` contains the Supabase client
- `tests/` contains the tests frontend and backend tests
- `docs/` stores user, technical, and architecture documentation.  
- `README.md` contains general overview and quick start information.

## Environment Variables
Place these in `.env.local`
###Required### (app won't boot without these)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public key used by client-side Supabase SDK
- `OPENAI_API_KEY` - API key for GPT-4o-mini condition analysis
###Scraper / HTML Fetching### (for full backend/dev mode)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `MARKETPLACE_HTML_FETCH_MODE` - `auto`, `playwright`, or `http` (default `auto`)
- `BROWSERLESS_WS_URL` - Browserless Playwright websocket URL for Marketplace HTML fetches   ###Optional variables:###
- `FACEBOOK_COOKIE_HEADER` - Cookie header string for logged-in Marketplace access when needed
- `FACEBOOK_PLAYWRIGHT_STORAGE_STATE_B64` - Base64-encoded Playwright storage state JSON for authenticated Browserless sessions
- `MARKETPLACE_HTML_TIMEOUT_MS` - Marketplace fetch timeout per candidate in milliseconds
- `MARKETPLACE_PLAYWRIGHT_BOOTSTRAP` - Enable Playwright bootstrap navigation (`true`/`false`)

## Building the Software

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Testing the Software

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

## Adding New Tests
### Frontend (Jest)
- Place tests in `tests/frontend/`
- File names must end with: ``*.test.tsx``
- Use React Testing Library mocks for components using Supabase or OpenAI

### Backend (Mocha + Chai)
- Place tests in `tests/backend`
- File names must end with: ``*test.ts``
- Use the existing mock Supabase client when testing DB logic
- API route handlers should be tested through the Next.js request/response mock utilities

### Continuous Integration
Tests run automatically on:
- Every push to any branch
- Every pull request to `main`
- View CI status: https://github.com/tanner-pham/Baller/actions

## Branch and Contributing Workflow
We use a simple workflow:
* ``main`` --- stable branch
* change branches: ``<person_id>/<branch_name>``
PR requirements:
* Must pass CI
* Must include tests for new functions
* Must update documentation when adding new modules
* Have 1+ peers code review changes and approve

## Coding Standards
### TypeScript rules
* No `any` unless strictly necessary
* Prefer explicit return types for all exported functions

### File Naming Conventions
* React components: `ComponentName.tsx`
* Utilities: `camelCase.ts`
* API routes: follow Next.js App Router conventions

### Commit Message Style
Use conventional commit format:
```
feat: add ___
fix: correct ___
test: add ___
```

## API Routes
### Existing API Routes
- `/api/marketplace-listing` – main listing fetcher
- `/api/simple-listings` – lightweight comparable fetcher
- `/api/assess-condition` – AI condition scoring
- `/api/compare-verdict` - pricing/condition verdict generator
- `/api/similar-listings` - similar listings fetcher

### Adding a New API Route
1. Create a folder under:
`src/app/api/<route>/route.ts`
2. Follow the existing route handlers for
	* input validation
	* error handling
	* Supabase interaction 
3. Add tests in:
`tests/backend/<route>.test.ts`

## Release Process
### Pre-release Manual Checks
Before tagging a release, perform the following manual tasks:
1. Ensure all required production environment variables are configured in Vercel
2. Confirm Browserless / Playwright configuration is active for production scraping
3. Verify Supabase migrations are up to data (`supabase db diff`)
4. Update CHANGELOG or release notes
5. Run scraper test against a real Marketplace listing to ensure HTML parsing still works

### Git and Deployment
1. Update version in `package.json`
2. Commit with message: 
```
chore: bump version to vX.Y.Z
```
3. Run a production build:
```
npm run build
```
4. Tag release:
```
git tag -a v0.x.x -m "___ release"
git push origin v0.x.x
```
5. Verify CI (dashboard, API routes, auth, ML pipeline) passes
6. Deploy via Vercel dashboard or GitHub integration


## Where to Put New Documentation
* Developer docs -> `CONTRIBUTING.md`
* Folder -> the folder's `README.md`
* Architecture or diagrams `/docs/`
* User-facing docs -> top-level README
