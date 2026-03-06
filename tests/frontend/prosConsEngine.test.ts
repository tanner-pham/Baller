import { generateRuleBasedProsConsForSide, type ProConChip } from '../../src/app/compare/utils/prosConsEngine';
import type { PriceDiff, ConditionDiff } from '../../src/app/compare/utils/diffUtils';
import type { ConditionAssessmentData } from '../../src/app/dashboard/types';
import type { MarketplaceListingApiData } from '../../src/app/dashboard/types';

// Helper to build a minimal PriceDiff
function makePriceDiff(overrides: Partial<PriceDiff> = {}): PriceDiff {
  return {
    leftPrice: null,
    rightPrice: null,
    difference: null,
    cheaperSide: null,
    ...overrides,
  };
}

// Helper to build a minimal ConditionDiff
function makeConditionDiff(overrides: Partial<ConditionDiff> = {}): ConditionDiff {
  return {
    leftScore: null,
    rightScore: null,
    leftLabel: null,
    rightLabel: null,
    betterSide: null,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<ConditionAssessmentData> = {}): ConditionAssessmentData {
  return { ...overrides };
}

function makeListing(overrides: Partial<MarketplaceListingApiData> = {}): MarketplaceListingApiData {
  return { ...overrides };
}

describe('generateRuleBasedProsConsForSide', () => {
  // Price tests
  it('left listing is $150 cheaper -> left gets pro "~$150 cheaper", right gets con "~$150 more expensive"', () => {
    const priceDiff = makePriceDiff({ leftPrice: 350, rightPrice: 500, difference: 150, cheaperSide: 'left' });
    const conditionDiff = makeConditionDiff();

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    expect(leftChips).toContainEqual(expect.objectContaining({ label: '~$150 cheaper', type: 'pro', source: 'rule' }));
    expect(rightChips).toContainEqual(expect.objectContaining({ label: '~$150 more expensive', type: 'con', source: 'rule' }));
  });

  it('prices are equal -> neither side gets price chip', () => {
    const priceDiff = makePriceDiff({ leftPrice: 500, rightPrice: 500, difference: 0, cheaperSide: 'equal' });
    const conditionDiff = makeConditionDiff();

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    const priceChips = [...leftChips, ...rightChips].filter(
      (c) => c.label.includes('cheaper') || c.label.includes('more expensive'),
    );
    expect(priceChips).toHaveLength(0);
  });

  it('one price is missing -> no price chips for either side', () => {
    const priceDiff = makePriceDiff({ leftPrice: 500, rightPrice: null, difference: null, cheaperSide: null });
    const conditionDiff = makeConditionDiff();

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    const priceChips = [...leftChips, ...rightChips].filter(
      (c) => c.label.includes('cheaper') || c.label.includes('more expensive'),
    );
    expect(priceChips).toHaveLength(0);
  });

  // Condition tests
  it('left has better condition (0.8 vs 0.5) -> left gets pro "Better condition", right gets con "Lower condition"', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff({ leftScore: 0.8, rightScore: 0.5, betterSide: 'left' });

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    expect(leftChips).toContainEqual(expect.objectContaining({ label: 'Better condition', type: 'pro', source: 'rule' }));
    expect(rightChips).toContainEqual(expect.objectContaining({ label: 'Lower condition', type: 'con', source: 'rule' }));
  });

  it('conditions are equal -> neither gets condition chip', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff({ leftScore: 0.7, rightScore: 0.7, betterSide: 'equal' });

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    const condChips = [...leftChips, ...rightChips].filter(
      (c) => c.label.includes('condition'),
    );
    expect(condChips).toHaveLength(0);
  });

  // Suggested offer tests
  it('left has lower suggested offer -> left gets pro chip, right gets con chip', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff();
    const leftAssessment = makeAssessment({ suggestedOffer: '$400' });
    const rightAssessment = makeAssessment({ suggestedOffer: '$550' });

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, leftAssessment, rightAssessment, makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, leftAssessment, rightAssessment, makeListing(), makeListing());

    expect(leftChips).toContainEqual(expect.objectContaining({ label: 'Lower suggested offer', type: 'pro', source: 'rule' }));
    expect(rightChips).toContainEqual(expect.objectContaining({ label: 'Higher suggested offer', type: 'con', source: 'rule' }));
  });

  // Market value tests
  it('listing priced below market gets pro, above gets con', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff();
    // Left listing: $400 price, market value from similar listings averages higher
    const leftListing = makeListing({ price: '$400', similarListings: [{ price: 500 } as any, { price: 600 } as any] });
    // Right listing: $800 price, market value from similar listings averages lower
    const rightListing = makeListing({ price: '$800', similarListings: [{ price: 500 } as any, { price: 600 } as any] });

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);

    expect(leftChips).toContainEqual(expect.objectContaining({ label: 'Priced below market', type: 'pro', source: 'rule' }));
    expect(rightChips).toContainEqual(expect.objectContaining({ label: 'Priced above market', type: 'con', source: 'rule' }));
  });

  // Listing age tests
  it('more recently listed gets pro when both dates are parseable', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff();
    const leftListing = makeListing({ listingDate: '2026-03-05' });
    const rightListing = makeListing({ listingDate: '2026-02-15' });

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);

    expect(leftChips).toContainEqual(expect.objectContaining({ label: 'Listed more recently', type: 'pro', source: 'rule' }));
    // Right side should not get the "Listed more recently" pro
    expect(rightChips.find((c) => c.label === 'Listed more recently')).toBeUndefined();
  });

  it('missing listing age -> no age chips', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff();
    const leftListing = makeListing({ listingDate: '2026-03-05' });
    const rightListing = makeListing(); // no listingDate

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), leftListing, rightListing);

    const ageChips = [...leftChips, ...rightChips].filter(
      (c) => c.label.includes('recently'),
    );
    expect(ageChips).toHaveLength(0);
  });

  // Edge cases
  it('all data missing -> returns empty array', () => {
    const priceDiff = makePriceDiff();
    const conditionDiff = makeConditionDiff();

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());
    const rightChips = generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    expect(leftChips).toEqual([]);
    expect(rightChips).toEqual([]);
  });

  it('partial data (only price available) -> returns only price-related chips', () => {
    const priceDiff = makePriceDiff({ leftPrice: 300, rightPrice: 500, difference: 200, cheaperSide: 'left' });
    const conditionDiff = makeConditionDiff();

    const leftChips = generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, makeAssessment(), makeAssessment(), makeListing(), makeListing());

    expect(leftChips).toHaveLength(1);
    expect(leftChips[0].label).toContain('cheaper');
    expect(leftChips[0].type).toBe('pro');
    expect(leftChips[0].source).toBe('rule');
  });
});
