import {
  parsePriceToNumber,
  computeMarketValue,
} from '../../src/app/compare/utils/listingUtils';

describe('parsePriceToNumber', () => {
  it('parses "$650" to 650', () => {
    expect(parsePriceToNumber('$650')).toBe(650);
  });

  it('parses "$1,200" to 1200', () => {
    expect(parsePriceToNumber('$1,200')).toBe(1200);
  });

  it('returns null for undefined', () => {
    expect(parsePriceToNumber(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePriceToNumber('')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parsePriceToNumber('free')).toBeNull();
  });

  it('returns null for "$0"', () => {
    expect(parsePriceToNumber('$0')).toBeNull();
  });

  it('parses "500" without dollar sign', () => {
    expect(parsePriceToNumber('500')).toBe(500);
  });
});

describe('computeMarketValue', () => {
  it('returns average of listing price and similar listings', () => {
    const result = computeMarketValue('$1,000', [
      { price: 800 },
      { price: 1200 },
    ]);
    expect(result).toBe('$1,000');
  });

  it('returns listing price when no similar listings', () => {
    expect(computeMarketValue('$500', undefined)).toBe('$500');
  });

  it('returns listing price when similar listings are empty', () => {
    expect(computeMarketValue('$500', [])).toBe('$500');
  });

  it('returns "N/A" when no prices available', () => {
    expect(computeMarketValue(undefined, [])).toBe('N/A');
  });

  it('uses only similar listings when listing price is undefined', () => {
    const result = computeMarketValue(undefined, [
      { price: 600 },
      { price: 800 },
    ]);
    expect(result).toBe('$700');
  });

  it('excludes zero-price similar listings', () => {
    const result = computeMarketValue('$1,000', [
      { price: 800 },
      { price: 0 },
    ]);
    expect(result).toBe('$900');
  });
});
