import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  buildMarketplaceSearchUrl,
  looksLikeFacebookAuthWall,
  parseMarketplaceListingHtml,
  parseMarketplaceSearchHtml,
} from '../src/app/api/marketplace-listing/parseHtml';

describe('Marketplace HTML parser', () => {
  it('parses core listing fields and gallery images from listing HTML', () => {
    const listingHtml = `
      <html>
        <body>
          <img alt="Product photo of Macbook Air M2 2022" src="https://example.com/gallery-1.jpg" />
          <img alt="Product photo of Macbook Air M2 2022" src="https://example.com/gallery-2.jpg" />
          <script>
            ${JSON.stringify({
              data: {
                marketplace_search: {
                  feed_units: {
                    edges: [
                      {
                        node: {
                          listing: {
                            id: '123456',
                            marketplace_listing_title: 'Macbook Air M2 2022',
                            listing_price: { formatted_amount: '$550' },
                            location: {
                              reverse_geocode: {
                                city_page: { display_name: 'Kent, Washington' },
                              },
                            },
                            primary_listing_photo: {
                              image: { uri: 'https://example.com/primary.jpg' },
                            },
                            redacted_description: { text: 'Excellent condition.' },
                            marketplace_listing_seller: { name: 'Jane Doe' },
                            creation_time: 1700000000,
                            commerce_search_and_rp_condition: 'used_like_new',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            })}
          </script>
        </body>
      </html>
    `;

    const parsed = parseMarketplaceListingHtml({
      html: listingHtml,
      requestedItemId: '123456',
    });

    expect(parsed.listing.title).to.equal('Macbook Air M2 2022');
    expect(parsed.listing.price).to.equal('$550');
    expect(parsed.listing.location).to.equal('Kent, Washington');
    expect(parsed.listing.description).to.equal('Excellent condition.');
    expect(parsed.listing.sellerName).to.equal('Jane Doe');
    expect(parsed.listing.condition).to.equal('used_like_new');
    expect(parsed.listing.images).to.deep.equal([
      'https://example.com/primary.jpg',
      'https://example.com/gallery-1.jpg',
      'https://example.com/gallery-2.jpg',
    ]);
  });

  it('parses and deduplicates simple listings from search HTML', () => {
    const searchHtml = `
      <html>
        <body>
          <script>
            ${JSON.stringify({
              data: {
                marketplace_search: {
                  feed_units: {
                    edges: [
                      {
                        node: {
                          listing: {
                            id: '111',
                            marketplace_listing_title: 'Macbook Air',
                            listing_price: { formatted_amount: '$500' },
                            location: {
                              reverse_geocode: {
                                city_page: { display_name: 'Seattle, Washington' },
                              },
                            },
                            primary_listing_photo: {
                              image: { uri: 'https://example.com/a.jpg' },
                            },
                          },
                        },
                      },
                      {
                        node: {
                          listing: {
                            id: '111',
                            marketplace_listing_title: 'Macbook Air',
                            listing_price: { formatted_amount: '$500' },
                            location: {
                              reverse_geocode: {
                                city_page: { display_name: 'Seattle, Washington' },
                              },
                            },
                            primary_listing_photo: {
                              image: { uri: 'https://example.com/a.jpg' },
                            },
                          },
                        },
                      },
                      {
                        node: {
                          listing: {
                            id: '222',
                            marketplace_listing_title: 'Macbook Pro',
                            listing_price: { formatted_amount: '$900' },
                            location: {
                              reverse_geocode: {
                                city_page: { display_name: 'Bellevue, Washington' },
                              },
                            },
                            primary_listing_photo: {
                              image: { uri: 'https://example.com/b.jpg' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            })}
          </script>
        </body>
      </html>
    `;

    const simpleListings = parseMarketplaceSearchHtml(searchHtml);

    expect(simpleListings.length).to.equal(2);
    expect(simpleListings[0]).to.deep.equal({
      title: 'Macbook Air',
      price: '$500',
      location: 'Seattle, Washington',
      image: 'https://example.com/a.jpg',
      link: 'https://www.facebook.com/marketplace/item/111/',
    });
  });

  it('builds marketplace search URL with condition and price band', () => {
    const searchUrl = buildMarketplaceSearchUrl({
      title: 'Macbook Air M2 2022',
      location: 'Kent, Washington',
      condition: 'used_like_new',
      price: '$550',
    });

    const parsedUrl = new URL(searchUrl);

    expect(parsedUrl.pathname).to.equal('/marketplace/search');
    expect(parsedUrl.searchParams.get('query')).to.equal(
      'Macbook Air M2 2022 Kent, Washington',
    );
    expect(parsedUrl.searchParams.get('itemCondition')).to.equal('used_like_new');
    expect(parsedUrl.searchParams.get('minPrice')).to.equal('385');
    expect(parsedUrl.searchParams.get('maxPrice')).to.equal('715');
  });

  it('detects auth wall HTML payloads', () => {
    const authWallHtml = '<html><body><form id="login_form"></form></body></html>';
    expect(looksLikeFacebookAuthWall(authWallHtml)).to.equal(true);
    expect(looksLikeFacebookAuthWall('<html><body>Marketplace content</body></html>')).to.equal(false);
    expect(looksLikeFacebookAuthWall('<html><body>Create a new account</body></html>')).to.equal(false);
  });
});
