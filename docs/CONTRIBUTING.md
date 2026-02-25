# Developer Guidelines
Welcome and thank you for you interesting in contributing! This developer guide describes how to contribute to **Baller**.
This document focuses on internal development practices, architecture, and contribution workflow.

For setup instructions, environment configuration, and general usage, see the [top-level README](../README.md).

## Obtaining the source code
Follow the instructions in [README -- Environment Setup / Installation](../README.md#environment-setup--installation)

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
├── tests/ # Frontend and backend tests 
├── docs/ # User and Developer documentation  
└── README.md # Setup and general overview
```

### Directory Responsibilities
- `src/` contains the frontend and API interface layer.  
- `backend/` contains the Supabase client
- `tests/` contains the tests frontend and backend tests
- `docs/` stores user, technical, and architecture documentation.  
- `README.md` contains setup, installation, and general usage instructions.

## Building & Test Commands
### Build, development, environment setup, and test commands are documented in:
[README -- Building the System](../README.md#building-the-system)

This includes:
* dev server (`npm run dev`)
* production build (`npm run build`)
* environment variables
___
[README -- Testing the System](../README.md#testing-the-system)

Which covers:
* Jest (frontend) - `npm test`
* Mocha/Chai (backend) - `npm run test:backend`
* Linting - `npm run lint`
* Type Checking - `npx tsc --noEmit`
* Or all tests - `npm run test:all`
* Coverage tools

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

## Branch and Contributing Workflow
We use a simple workflow:
* ``main`` --- stable branch
* feature branches: ``feature/<name>``
* bugfix branches: ``fix/<name>``
* releases: ``release/v0.x.x``
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

## Adding a New API Route
1. Create a folder under:
`src/app/api/<route>/route.ts`
2. Follow the existing route handlers for
	* input validation
	* error handling
	* Supabase interaction 
3. Add tests in:
`tests/backend/<route>.test.ts`

## Release Process
1. Update version in `package.json`
2. Run a production build:
`npm run build`
3. Verify dashboard, API routes, auth, ML pipeline
4. Tag release:
```
git tag -a v0.x.x -m "___ release"
git push origin v0.x.x
```

## Where to Put New Documentation
* Developer docs -> `CONTRIBUTING.md`
* Folder -> the folder's `README.md`
* Architecture or diagrams `/docs/`
* User-facing docs -> top-level README
