import { expect } from 'chai';
import { describe, it } from 'mocha';

interface SimilarListing {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

type SimulatedResponse =
  | { status: 202; body: { success: true; status: 'pending'; retryAfterMs: number } }
  | { status: 200; body: { success: true; status: 'ready' | 'stale'; similarListings: SimilarListing[] } }
  | { status: 500 | 502; body: { success: false; status: 'error'; error: string } };

function simulateSimilarListings(state: 'pending' | 'ready' | 'stale' | 'error'): SimulatedResponse {
  if (state === 'pending') {
    return {
      status: 202,
      body: {
        success: true,
        status: 'pending',
        retryAfterMs: 2000,
      },
    };
  }

  if (state === 'ready' || state === 'stale') {
    return {
      status: 200,
      body: {
        success: true,
        status: state,
        similarListings: [
          {
            title: 'MacBook Pro 14',
            location: 'Seattle',
            price: 1200,
            image: 'https://example.com/image.jpg',
            link: 'https://www.facebook.com/marketplace/item/123',
          },
        ],
      },
    };
  }

  return {
    status: 502,
    body: {
      success: false,
      status: 'error',
      error: 'Failed to enqueue similar-listings job.',
    },
  };
}

describe('GET /api/similar-listings contract', () => {
  it('returns 202 pending shape while work is still in progress', () => {
    const response = simulateSimilarListings('pending');

    expect(response.status).to.equal(202);
    expect(response.body.success).to.equal(true);
    expect(response.body.status).to.equal('pending');
  });

  it('returns 200 ready shape with similar listings payload', () => {
    const response = simulateSimilarListings('ready');

    expect(response.status).to.equal(200);
    if (response.status !== 200) {
      throw new Error('Expected ready response status to be 200.');
    }

    expect(response.body.status).to.equal('ready');
    expect(response.body.similarListings).to.be.an('array');
    expect(response.body.similarListings.length).to.be.greaterThan(0);
  });

  it('returns 200 stale shape when stale fallback is used', () => {
    const response = simulateSimilarListings('stale');

    expect(response.status).to.equal(200);
    if (response.status !== 200) {
      throw new Error('Expected stale response status to be 200.');
    }

    expect(response.body.status).to.equal('stale');
    expect(response.body.similarListings).to.be.an('array');
  });

  it('returns error shape when async pipeline fails', () => {
    const response = simulateSimilarListings('error');

    expect(response.status).to.equal(502);
    if (response.status === 202 || response.status === 200) {
      throw new Error('Expected error status for failed similar listings state.');
    }

    expect(response.body.success).to.equal(false);
    expect(response.body.status).to.equal('error');
    expect(response.body.error.length).to.be.greaterThan(0);
  });
});
