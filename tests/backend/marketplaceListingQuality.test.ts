import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  getMarketplaceListingCompletenessScore,
  isCacheableMarketplaceListingPayload,
} from '../../src/lib/server/marketplaceListingQuality';

describe('marketplace listing quality guards', () => {
  it('rejects shell payloads that are missing both description and images', () => {
    expect(
      isCacheableMarketplaceListingPayload({
        title: 'Vintage Kerosene Lamps',
        price: '$57',
        location: 'Kirkland, Washington',
      }),
    ).to.equal(false);
  });

  it('accepts payloads with a real listing image even when description is absent', () => {
    expect(
      isCacheableMarketplaceListingPayload({
        title: 'Vintage Kerosene Lamps',
        price: '$57',
        location: 'Kirkland, Washington',
        images: ['https://example.com/live-primary.jpg'],
      }),
    ).to.equal(true);
  });

  it('scores hydrated listing payloads higher than partial shells', () => {
    const shellScore = getMarketplaceListingCompletenessScore({
      title: 'Vintage Kerosene Lamps',
      price: '$57',
      location: 'Kirkland, Washington',
    });

    const hydratedScore = getMarketplaceListingCompletenessScore({
      title: 'Vintage Kerosene Lamps',
      price: '$57',
      location: 'Kirkland, Washington',
      description: 'Functional condition with no major damage impacts value positively.',
      images: ['https://example.com/live-primary.jpg'],
      sellerName: 'Taylor',
      condition: 'used_good',
    });

    expect(hydratedScore).to.be.greaterThan(shellScore);
  });
});
