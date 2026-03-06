# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Dual Runner Setup -- Two separate test systems:**

**1. Jest (Frontend):**
- Jest 30 with ts-jest transformer
- Config: `jest.config.ts`
- Environment: jsdom
- Setup: `jest.setup.ts` (imports `@testing-library/jest-dom`)
- Used for: React component tests

**2. Mocha + Chai (Backend):**
- Mocha 11 with tsx loader
- Chai 6 for assertions
- No config file -- invoked via npm script with glob pattern
- Used for: Backend unit tests, API simulation tests, HTML parser tests

**Run Commands:**
```bash
npm test                    # Jest frontend tests with coverage
npm run test:backend        # Mocha backend tests
npm run test:all            # Both Jest and Mocha sequentially
```

**Assertion Libraries:**
- Frontend (Jest): `@testing-library/jest-dom` matchers (`toBeInTheDocument()`)
- Backend (Mocha): Chai `expect` style (`expect(x).to.equal(y)`, `expect(x).to.be.a('string')`)
- Backend (URL tests): Node.js built-in `assert` module (`assert.equal`, `assert.ok`)

## Test File Organization

**Location:**
- Frontend tests: `tests/frontend/` (separate directory from source)
- Backend tests: `tests/backend/` (separate directory from source)
- Legacy backend tests: `backend/` (root-level directory, also run by `test:backend` script)

**Naming:**
- `{ComponentName}.test.tsx` for React component tests
- `{feature-name}.test.ts` for backend tests
- Descriptive kebab-case for test files: `assess-condition.test.ts`, `supabaseClient.test.ts`

**Structure:**
```
tests/
  frontend/
    SimilarListings.test.tsx          # React component test (Jest)
  backend/
    supabaseClient.test.ts            # Environment/client init test (Mocha)
    assess-condition.test.ts          # API simulation test (Mocha)
backend/
  marketplaceHtmlParser.test.ts       # HTML parser unit tests (Mocha)
  facebookMarketplaceListingUrl.test.ts  # URL parsing unit tests (Mocha)
```

## Test Structure

**Frontend Component Test Pattern (Jest + React Testing Library):**
```typescript
import { render, screen } from '@testing-library/react';
import { SimilarListings } from '@/src/app/dashboard/(components)/SimilarListings';

describe('SimilarListings Component', () => {
  const mockListings = [
    {
      title: 'MacBook Pro 2020',
      location: 'Seattle, WA',
      price: 800,
      image: 'https://example.com/image1.jpg',
      link: 'https://facebook.com/marketplace/item/123',
    },
  ];

  it('renders the similar listings heading', () => {
    render(<SimilarListings listings={mockListings} />);
    expect(screen.getByText('SIMILAR LISTINGS')).toBeInTheDocument();
  });

  it('renders empty state when no listings provided', () => {
    render(<SimilarListings listings={[]} />);
    expect(screen.getByText('SIMILAR LISTINGS')).toBeInTheDocument();
  });
});
```

**Backend Unit Test Pattern (Mocha + Chai):**
```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  parseMarketplaceListingHtml,
  parseMarketplaceSearchHtml,
} from '../src/app/api/marketplace-listing/parseHtml';

describe('Marketplace HTML parser', () => {
  it('parses core listing fields from listing HTML', () => {
    const listingHtml = `<html>...<script>${JSON.stringify(graphqlPayload)}</script>...</html>`;

    const parsed = parseMarketplaceListingHtml({
      html: listingHtml,
      requestedItemId: '123456',
    });

    expect(parsed.listing.title).to.equal('Macbook Air M2 2022');
    expect(parsed.listing.price).to.equal('$550');
  });
});
```

**Backend Test with Node.js Assert (alternative pattern):**
```typescript
import assert from 'node:assert/strict';
import {
  isFacebookMarketplaceListingUrl,
  parseFacebookMarketplaceListingUrl,
} from '../src/lib/facebookMarketplaceListing';

describe('facebookMarketplaceListing URL parsing', () => {
  it('accepts canonical and mobile marketplace item URLs', () => {
    const urls = [
      'https://www.facebook.com/marketplace/item/1234567890/',
      'https://m.facebook.com/marketplace/item/1234567890/?ref=share',
    ];

    for (const url of urls) {
      const parsed = parseFacebookMarketplaceListingUrl(url);
      assert.ok(parsed, `Expected URL to parse: ${url}`);
      assert.equal(parsed.itemId, '1234567890');
    }
  });
});
```

**Patterns:**
- Use `describe()` blocks to group related tests by component or feature
- Use nested `describe()` for sub-categories: `describe('Success cases')`, `describe('Error cases')`
- Each `it()` tests one specific behavior
- Mock data is defined at the top of the `describe()` block as `const mockListings = [...]`
- Inline HTML strings are constructed with template literals embedding `JSON.stringify()` for GraphQL payloads

## Mocking

**Framework:** No dedicated mocking library (no jest.mock for backend, no sinon)

**Frontend Mocking:**
- Component tests render with real props -- no mocking of child components
- No API mocking framework in use; tests focus on rendering with mock data passed as props

**Backend Mocking:**
- API simulation pattern: create a `simulate*()` function that mirrors the route handler logic without making external calls:
  ```typescript
  function mockGPTVisionSuccess() {
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              conditionScore: 0.85,
              conditionLabel: 'Like New',
              // ...
            }),
          },
        },
      ],
    };
  }

  async function simulateAssessCondition(
    imageUrl: string,
    mockResponse: ReturnType<typeof mockGPTVisionSuccess>,
  ): Promise<SimulatedAssessResult> {
    if (!imageUrl) {
      return { status: 400, body: { error: 'Image URL is required' } };
    }
    // ... mirrors route handler logic
  }
  ```

**What to Mock:**
- External API responses (OpenAI GPT Vision responses)
- Use inline HTML string fixtures for HTML parser tests (construct fake Facebook page HTML)

**What NOT to Mock:**
- Pure parsing functions are tested directly with real inputs
- URL validation functions are tested with real URLs
- Component rendering is tested with real props against real component tree

## Fixtures and Factories

**Test Data:**
- Inline HTML strings constructed in each test case with embedded JSON:
  ```typescript
  const listingHtml = `
    <html><body>
      <script>${JSON.stringify({
        data: {
          marketplace_search: {
            feed_units: {
              edges: [{ node: { listing: { /* ... */ } } }],
            },
          },
        },
      })}</script>
    </body></html>
  `;
  ```
- Mock listing objects are plain object literals defined in `describe()` scope
- Simulated API response interfaces are defined inline in test files:
  ```typescript
  interface SimulatedAssessment {
    conditionScore: number;
    conditionLabel: string;
    // ...
  }
  ```

**Location:**
- No shared fixtures directory
- All test data is co-located in the test file that uses it
- Default/fallback test data for the dashboard is in `src/app/dashboard/constants.ts` (used in both app and potentially tests)

## Coverage

**Requirements:** No enforced coverage threshold. Coverage is generated but not gated.

**View Coverage:**
```bash
npm test                          # Generates coverage automatically (--coverage flag in script)
open coverage/lcov-report/index.html  # View HTML coverage report
```

**Coverage Output:**
- `coverage/lcov-report/` -- HTML report
- `coverage/lcov.info` -- LCOV format
- `coverage/clover.xml` -- Clover XML format
- `coverage/coverage-final.json` -- JSON format

**Scope:**
- Coverage is collected from `src/**/*.{ts,tsx}` excluding `.d.ts` and `.test.*` files
- Only Jest (frontend) tests contribute to coverage reports
- Mocha (backend) tests do not generate coverage

## Test Types

**Unit Tests:**
- HTML parsing tests: Verify extraction of listing fields from various Facebook HTML payload shapes (JSON GraphQL, DOM fallback, meta tags)
- URL parsing tests: Verify acceptance/rejection of Facebook Marketplace URL formats
- URL builder tests: Verify search URL construction with condition and price band parameters
- Auth wall detection tests: Verify classification of login/interstitial pages vs. real marketplace content

**Integration-style Tests:**
- API simulation tests: Mirror route handler logic with mocked external dependencies (OpenAI responses)
- Environment validation tests: Verify Supabase client initialization with environment variables

**Component Tests:**
- React component rendering tests using Testing Library
- Verify text content, presence of elements, and empty state rendering
- No interaction tests (no `userEvent` or `fireEvent` usage observed)

**E2E Tests:**
- Not used. No Cypress, Playwright Test, or similar E2E framework configured.

## Common Patterns

**Async Testing (Mocha + Chai):**
```typescript
it('should return condition assessment when given valid image URL', async () => {
  const imageUrl = 'https://example.com/macbook.jpg';
  const mockResponse = mockGPTVisionSuccess();
  const result = await simulateAssessCondition(imageUrl, mockResponse);

  expect(result.status).to.equal(200);
  expect(result.body.assessment.conditionScore).to.be.a('number');
  expect(result.body.assessment.conditionScore).to.be.at.least(0);
  expect(result.body.assessment.conditionScore).to.be.at.most(1);
});
```

**Error Testing (Mocha + Chai):**
```typescript
it('should return 400 when image URL is missing', async () => {
  const mockResponse = mockGPTVisionSuccess();
  const result = await simulateAssessCondition('', mockResponse);

  expect(result.status).to.equal(400);
  if (result.status === 200) {
    throw new Error('Expected an error response for missing image URL.');
  }
  expect(result.body).to.have.property('error');
  expect(result.body.error).to.equal('Image URL is required');
});
```

**Discriminated Union Narrowing in Tests:**
- The assess-condition tests use TypeScript discriminated unions for result types
- A `getSuccessfulAssessment()` helper narrows the union before assertions:
  ```typescript
  function getSuccessfulAssessment(result: SimulatedAssessResult): SimulatedAssessment {
    if (result.status !== 200) {
      throw new Error(`Expected a success result, received status ${result.status}`);
    }
    return result.body.assessment;
  }
  ```

**Loop-based Validation (multiple inputs):**
```typescript
it('rejects non-marketplace and non-facebook URLs', () => {
  const invalidUrls = [
    'https://www.facebook.com/marketplace/search?query=laptop',
    'https://www.example.com/marketplace/item/1234567890/',
    'not-a-url',
  ];

  for (const url of invalidUrls) {
    assert.equal(parseFacebookMarketplaceListingUrl(url), null);
    assert.equal(isFacebookMarketplaceListingUrl(url), false);
  }
});
```

**Deep Equality for Structured Output:**
```typescript
expect(simpleListings[0]).to.deep.equal({
  title: 'Macbook Air',
  price: '$500',
  location: 'Seattle, Washington',
  image: 'https://example.com/a.jpg',
  link: 'https://www.facebook.com/marketplace/item/111/',
});
```

## Adding New Tests

**New frontend component test:**
1. Create `tests/frontend/{ComponentName}.test.tsx`
2. Import component using `@/src/...` alias
3. Use `render()` + `screen` from Testing Library
4. Run with `npm test`

**New backend unit test:**
1. Create `tests/backend/{feature-name}.test.ts`
2. Import from source using relative paths: `../../src/...`
3. Use `import { expect } from 'chai'` and `import { describe, it } from 'mocha'`
4. Run with `npm run test:backend`

**New parser/utility test:**
1. Can also be placed in `backend/{name}.test.ts` (legacy location)
2. Same Mocha + Chai pattern
3. Matched by glob `'tests/backend/**/*.test.ts'` or invoked directly

## Known Testing Gaps

- No tests for React hooks (`useMarketplaceListing`, `useConditionAssessment`, `useSearchHistory`, `useDashboardSession`)
- No tests for `DashboardClient.tsx` (main orchestrating component)
- No tests for API route handlers directly (only simulation tests that mirror logic)
- No tests for `facebookMarketplaceHtmlFetcher.ts` (complex multi-transport fetcher)
- No tests for `scrapeMarketplace.ts` (scraper orchestration)
- No tests for `Navigation.tsx` (complex auth-aware component)
- No interaction tests (click, form submission, keyboard events)
- No API integration tests using `supertest` (installed but unused)
- Coverage only tracks Jest runs; Mocha backend tests have no coverage reporting

---

*Testing analysis: 2026-03-05*
