import assert from 'node:assert/strict';
import {
  isFacebookMarketplaceListingUrl,
  parseFacebookMarketplaceListingUrl,
} from '../src/lib/facebookMarketplaceListing';

describe('facebookMarketplaceListing URL parsing', () => {
  it('accepts canonical and mobile marketplace item URLs', () => {
    const urls = [
      'https://www.facebook.com/marketplace/item/1234567890/',
      'https://facebook.com/marketplace/item/1234567890',
      'https://m.facebook.com/marketplace/item/1234567890/?ref=share',
      'https://mbasic.facebook.com/marketplace/item/1234567890',
    ];

    for (const url of urls) {
      const parsed = parseFacebookMarketplaceListingUrl(url);

      assert.ok(parsed, `Expected URL to parse: ${url}`);
      assert.equal(parsed.itemId, '1234567890');
      assert.equal(
        parsed.normalizedUrl,
        'https://www.facebook.com/marketplace/item/1234567890/',
      );
    }
  });

  it('rejects non-marketplace and non-facebook URLs', () => {
    const invalidUrls = [
      'https://www.facebook.com/marketplace/search?query=laptop',
      'https://www.example.com/marketplace/item/1234567890/',
      'http://www.facebook.com/marketplace/item/1234567890/',
      'not-a-url',
    ];

    for (const url of invalidUrls) {
      assert.equal(parseFacebookMarketplaceListingUrl(url), null);
      assert.equal(isFacebookMarketplaceListingUrl(url), false);
    }
  });
});
