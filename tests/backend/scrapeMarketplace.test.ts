import { expect } from 'chai';
import { describe, it } from 'mocha';
import { scrapeMarketplaceListing } from '../../src/lib/server/scraper/scrapeMarketplace';
import type { NormalizedSimpleListing } from '../../src/app/api/marketplace-listing/types';

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

async function waitFor(predicate: () => boolean, timeoutMs = 250): Promise<void> {
  const startTime = Date.now();

  while (!predicate()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Timed out waiting for expected scraper state.');
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('scrapeMarketplaceListing', () => {
  it('starts comparable search and detail retry without serially waiting on search completion', async () => {
    let completedInitialFetch = false;
    const events: string[] = [];
    const searchFetchGate = createDeferred<any>();
    const retryFetchGate = createDeferred<any>();

    const deps = {
      fetchMarketplaceHtmlWithFallback: async ({ urls }: { urls: string[] }) => {
        const url = urls[0];

        if (url.includes('/marketplace/item/123/')) {
          if (!completedInitialFetch) {
            completedInitialFetch = true;
            events.push('initial-fetch');
            return {
              html: 'initial-html',
              transport: 'playwright-local',
              capturedGraphqlPayloadMatchingItemIdCount: 0,
            };
          }

          events.push('retry-start');
          const result = await retryFetchGate.promise;
          events.push('retry-resolve');
          return result;
        }

        if (url.includes('/marketplace/search')) {
          events.push('search-start');
          const result = await searchFetchGate.promise;
          events.push('search-resolve');
          return result;
        }

        throw new Error(`Unexpected URL: ${url}`);
      },
      parseMarketplaceListingHtml: ({ html }: { html: string }) => {
        if (html === 'initial-html') {
          return {
            listing: {
              title: 'Tacoma',
              price: '$31,500',
              location: 'Snohomish, WA',
            },
            metadata: {
              scriptBlocksParsed: 1,
              listingCandidates: 0,
              selectedListingId: '123',
              usedGalleryImages: 0,
            },
          };
        }

        return {
          listing: {
            title: 'Tacoma',
            price: '$31,500',
            location: 'Snohomish, WA',
            description: 'Clean truck, no rust.',
            images: ['https://example.com/live.jpg'],
          },
          metadata: {
            scriptBlocksParsed: 1,
            listingCandidates: 1,
            selectedListingId: '123',
            usedGalleryImages: 1,
          },
        };
      },
      buildMarketplaceSearchUrl: () => 'https://www.facebook.com/marketplace/search?query=Tacoma',
      parseMarketplaceSearchHtml: (): NormalizedSimpleListing[] => [
        {
          title: 'Comparable Tacoma',
          price: '$30,900',
          location: 'Everett, WA',
          image: 'https://example.com/comp.jpg',
          link: 'https://www.facebook.com/marketplace/item/888/',
        },
      ],
    };

    const scrapePromise = scrapeMarketplaceListing(
      'https://www.facebook.com/marketplace/item/123/',
      '123',
      deps as any,
    );

    await waitFor(() => events.includes('search-start') && events.includes('retry-start'));

    expect(events).to.include('search-start');
    expect(events).to.include('retry-start');
    expect(events).to.not.include('search-resolve');

    searchFetchGate.resolve({
      html: 'search-html',
      transport: 'playwright-local',
      capturedGraphqlPayloadMatchingItemIdCount: 0,
    });
    retryFetchGate.resolve({
      html: 'retry-html',
      transport: 'playwright-local',
      capturedGraphqlPayloadMatchingItemIdCount: 1,
    });

    const result = await scrapePromise;

    expect(result.description).to.equal('Clean truck, no rust.');
    expect(result.images).to.deep.equal(['https://example.com/live.jpg']);
    expect(result.similarListings).to.deep.equal([
      {
        title: 'Comparable Tacoma',
        price: 30900,
        location: 'Everett, WA',
        image: 'https://example.com/comp.jpg',
        link: 'https://www.facebook.com/marketplace/item/888/',
      },
    ]);
  });

  it('fills retry gaps from comparable search results after parallel work completes', async () => {
    let completedInitialFetch = false;

    const deps = {
      fetchMarketplaceHtmlWithFallback: async ({ urls }: { urls: string[] }) => {
        const url = urls[0];

        if (url.includes('/marketplace/item/123/')) {
          if (!completedInitialFetch) {
            completedInitialFetch = true;
            return {
              html: 'initial-html',
              transport: 'playwright-local',
              capturedGraphqlPayloadMatchingItemIdCount: 0,
            };
          }

          return {
            html: 'retry-html',
            transport: 'playwright-local',
            capturedGraphqlPayloadMatchingItemIdCount: 1,
          };
        }

        if (url.includes('/marketplace/search')) {
          return {
            html: 'search-html',
            transport: 'playwright-local',
            capturedGraphqlPayloadMatchingItemIdCount: 0,
          };
        }

        throw new Error(`Unexpected URL: ${url}`);
      },
      parseMarketplaceListingHtml: ({ html }: { html: string }) => {
        if (html === 'initial-html') {
          return {
            listing: {
              title: 'Sony A7 III Camera',
              price: '$500',
            },
            metadata: {
              scriptBlocksParsed: 1,
              listingCandidates: 0,
              selectedListingId: '123',
              usedGalleryImages: 0,
            },
          };
        }

        return {
          listing: {
            title: 'Sony A7 III Camera',
            price: '$500',
            description: 'Includes extra battery and charger.',
          },
          metadata: {
            scriptBlocksParsed: 1,
            listingCandidates: 1,
            selectedListingId: '123',
            usedGalleryImages: 0,
          },
        };
      },
      buildMarketplaceSearchUrl: () => 'https://www.facebook.com/marketplace/search?query=Sony+A7+III',
      parseMarketplaceSearchHtml: (): NormalizedSimpleListing[] => [
        {
          title: 'Sony A7 III Camera',
          price: '$480',
          location: 'Portland, OR',
          image: 'https://example.com/camera.jpg',
          link: 'https://www.facebook.com/marketplace/item/123/',
        },
      ],
    };

    const result = await scrapeMarketplaceListing(
      'https://www.facebook.com/marketplace/item/123/',
      '123',
      deps as any,
    );

    expect(result.description).to.equal('Includes extra battery and charger.');
    expect(result.location).to.equal('Portland, OR');
    expect(result.images).to.deep.equal(['https://example.com/camera.jpg']);
    expect(result.similarListings).to.deep.equal([
      {
        title: 'Sony A7 III Camera',
        price: 480,
        location: 'Portland, OR',
        image: 'https://example.com/camera.jpg',
        link: 'https://www.facebook.com/marketplace/item/123/',
      },
    ]);
  });
});
