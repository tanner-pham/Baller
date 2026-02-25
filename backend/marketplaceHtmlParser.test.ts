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

  it('parses listing data from non-feed GraphQL payload shapes', () => {
    const listingHtml = `
      <html>
        <body>
          <script>
            ${JSON.stringify({
              data: {
                marketplace_listing_viewer: {
                  listing: {
                    id: '998877',
                    marketplace_listing_title: 'Lenovo ThinkPad X1',
                    listing_price: { formatted_amount: '$650' },
                    location: {
                      reverse_geocode: {
                        city_page: { display_name: 'Portland, Oregon' },
                      },
                    },
                    listing_photos: [
                      { image: { uri: 'https://example.com/photo-1.jpg' } },
                      { image: { uri: 'https://example.com/photo-2.jpg' } },
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
      requestedItemId: '998877',
    });

    expect(parsed.listing.title).to.equal('Lenovo ThinkPad X1');
    expect(parsed.listing.price).to.equal('$650');
    expect(parsed.listing.location).to.equal('Portland, Oregon');
    expect(parsed.listing.images).to.deep.equal([
      'https://example.com/photo-1.jpg',
      'https://example.com/photo-2.jpg',
    ]);
  });

  it('falls back to DOM extraction when JSON blocks are unavailable', () => {
    const listingHtml = `
      <html>
        <head>
          <meta property="og:title" content="Sony A7 III Camera" />
          <meta property="og:description" content="Great condition mirrorless body." />
          <meta property="product:price:amount" content="1200" />
          <meta property="og:image" content="https://example.com/cover.jpg" />
          <link rel="canonical" href="https://www.facebook.com/marketplace/item/555666777/" />
        </head>
        <body>
          <h1>Sony A7 III Camera</h1>
          <div>Listed in Seattle, Washington</div>
          <div>Condition Used - Like New</div>
          <a href="/marketplace/profile/abc123">Alex Seller</a>
          <img alt="Product photo of Sony A7 III Camera" src="https://example.com/detail.jpg" />
        </body>
      </html>
    `;

    const parsed = parseMarketplaceListingHtml({
      html: listingHtml,
      requestedItemId: '555666777',
    });

    expect(parsed.listing.title).to.equal('Sony A7 III Camera');
    expect(parsed.listing.description).to.equal('Great condition mirrorless body.');
    expect(parsed.listing.price).to.equal('$1,200');
    expect(parsed.listing.location).to.equal('Seattle, Washington');
    expect(parsed.listing.sellerName).to.equal('Alex Seller');
    expect(parsed.listing.condition).to.equal('used_like_new');
    expect(parsed.listing.images).to.deep.equal([
      'https://example.com/cover.jpg',
      'https://example.com/detail.jpg',
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

  it('falls back to DOM extraction for simple listings when JSON is unavailable', () => {
    const searchHtml = `
      <html>
        <body>
          <a href="/marketplace/item/111/">
            <img src="https://example.com/a.jpg" />
            <span>Macbook Air</span>
            <span>$500</span>
            <span>Seattle, Washington</span>
          </a>
          <a href="/marketplace/item/222/">
            <img src="https://example.com/b.jpg" />
            <span>Macbook Pro</span>
            <span>$900</span>
            <span>Bellevue, Washington</span>
          </a>
        </body>
      </html>
    `;

    const simpleListings = parseMarketplaceSearchHtml(searchHtml);

    expect(simpleListings).to.deep.equal([
      {
        title: 'Macbook Air',
        price: '$500',
        location: 'Seattle, Washington',
        image: 'https://example.com/a.jpg',
        link: 'https://www.facebook.com/marketplace/item/111/',
      },
      {
        title: 'Macbook Pro',
        price: '$900',
        location: 'Bellevue, Washington',
        image: 'https://example.com/b.jpg',
        link: 'https://www.facebook.com/marketplace/item/222/',
      },
    ]);
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
    expect(
      looksLikeFacebookAuthWall(
        '<html><body><form id="login_form"></form><script>{"data":{"marketplace_search":{"feed_units":{"edges":[]}}}}</script></body></html>',
      ),
    ).to.equal(false);
  });
});
