import { expect } from 'chai';
import { describe, it } from 'mocha';
import { buildSimilarSearchQuery } from '../src/lib/server/similarListingsQuery';

describe('Similar Listings Query Builder', () => {
  it('returns deterministic query hashes for identical listing payloads', () => {
    const listing = {
      title: 'MacBook Pro M3 14 inch',
      location: 'Seattle, WA',
      price: '$1,200',
    };

    const first = buildSimilarSearchQuery(listing);
    const second = buildSimilarSearchQuery(listing);

    expect(first.hash).to.equal(second.hash);
    expect(first.queryText).to.equal(second.queryText);
  });

  it('changes hash when core query-driving fields change', () => {
    const baseline = buildSimilarSearchQuery({
      title: 'MacBook Pro M3 14 inch',
      location: 'Seattle, WA',
      price: '$1,200',
    });

    const changedPrice = buildSimilarSearchQuery({
      title: 'MacBook Pro M3 14 inch',
      location: 'Seattle, WA',
      price: '$1,800',
    });

    expect(baseline.hash).to.not.equal(changedPrice.hash);
  });

  it('extracts at most three keywords and computes price band when possible', () => {
    const query = buildSimilarSearchQuery({
      title: 'Apple MacBook Pro M3 Max Laptop',
      location: 'Bellevue, WA',
      price: '$2,500',
    });

    expect(query.keywords.length).to.be.at.most(3);
    expect(query.minPrice).to.equal(2000);
    expect(query.maxPrice).to.equal(3000);
  });
});
