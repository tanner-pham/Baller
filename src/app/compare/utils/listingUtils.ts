// TODO: Consolidate with DashboardClient.tsx -- these are duplicated from there
// because parsePriceToNumber and computeMarketValue are not exported.

/**
 * Parses a price string like "$650" or "$1,200" to a number.
 */
export function parsePriceToNumber(price: string | undefined): number | null {
  if (!price) return null;
  const num = Number(price.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Computes the average market value from the listing price and similar listings.
 */
export function computeMarketValue(
  listingPrice: string | undefined,
  similarListings: Array<{ price: number }> | undefined,
): string {
  const prices: number[] = [];
  const listingNum = parsePriceToNumber(listingPrice);
  if (listingNum) prices.push(listingNum);

  if (similarListings) {
    for (const sl of similarListings) {
      if (sl.price > 0) prices.push(sl.price);
    }
  }

  if (prices.length === 0) return listingPrice ?? 'N/A';

  const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
  return `$${avg.toLocaleString()}`;
}
