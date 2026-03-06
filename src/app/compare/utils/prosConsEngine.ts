import type { PriceDiff, ConditionDiff } from './diffUtils';
import type { ConditionAssessmentData, MarketplaceListingApiData } from '../../dashboard/types';
import { parsePriceToNumber, computeMarketValue } from './listingUtils';

export interface ProConChip {
  label: string;
  type: 'pro' | 'con';
  source: 'rule' | 'ai';
}

/**
 * Parse a suggested offer string like "$400" or "400" into a number.
 * Returns null for missing, empty, zero, or NaN values.
 */
function parseOfferToNumber(offer: string | undefined): number | null {
  if (!offer) return null;
  const stripped = offer.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(stripped);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * Generates deterministic rule-based pro/con chips for a given side of the comparison.
 *
 * Chips are generated from:
 * 1. Price difference (cheaper side gets pro)
 * 2. Condition difference (better condition gets pro)
 * 3. Suggested offer comparison (lower offer gets pro)
 * 4. Market value comparison (below market = pro, above market >10% = con)
 * 5. Listing age comparison (more recently listed gets pro)
 *
 * Returns empty array (never throws) when data is insufficient.
 */
export function generateRuleBasedProsConsForSide(
  side: 'left' | 'right',
  priceDiff: PriceDiff,
  conditionDiff: ConditionDiff,
  leftAssessment: ConditionAssessmentData,
  rightAssessment: ConditionAssessmentData,
  leftListing: MarketplaceListingApiData,
  rightListing: MarketplaceListingApiData,
): ProConChip[] {
  const chips: ProConChip[] = [];
  const otherSide = side === 'left' ? 'right' : 'left';

  // 1. Price chips
  if (priceDiff.cheaperSide !== null && priceDiff.cheaperSide !== 'equal' && priceDiff.difference !== null && priceDiff.difference > 0) {
    const amount = Math.round(priceDiff.difference);
    if (priceDiff.cheaperSide === side) {
      chips.push({ label: `~$${amount} cheaper`, type: 'pro', source: 'rule' });
    } else {
      chips.push({ label: `~$${amount} more expensive`, type: 'con', source: 'rule' });
    }
  }

  // 2. Condition chips
  if (conditionDiff.betterSide !== null && conditionDiff.betterSide !== 'equal') {
    if (conditionDiff.betterSide === side) {
      chips.push({ label: 'Better condition', type: 'pro', source: 'rule' });
    } else {
      chips.push({ label: 'Lower condition', type: 'con', source: 'rule' });
    }
  }

  // 3. Suggested offer chips
  const leftOffer = parseOfferToNumber(leftAssessment.suggestedOffer);
  const rightOffer = parseOfferToNumber(rightAssessment.suggestedOffer);
  if (leftOffer !== null && rightOffer !== null && leftOffer !== rightOffer) {
    const lowerOfferSide: 'left' | 'right' = leftOffer < rightOffer ? 'left' : 'right';
    if (lowerOfferSide === side) {
      chips.push({ label: 'Lower suggested offer', type: 'pro', source: 'rule' });
    } else {
      chips.push({ label: 'Higher suggested offer', type: 'con', source: 'rule' });
    }
  }

  // 4. Market value chips (for THIS side only)
  const thisListing = side === 'left' ? leftListing : rightListing;
  const thisPrice = parsePriceToNumber(thisListing.price);
  if (thisPrice !== null && thisListing.similarListings && thisListing.similarListings.length > 0) {
    const marketValueStr = computeMarketValue(thisListing.price, thisListing.similarListings);
    const marketValue = parsePriceToNumber(marketValueStr);
    if (marketValue !== null && marketValue > 0) {
      if (thisPrice < marketValue) {
        chips.push({ label: 'Priced below market', type: 'pro', source: 'rule' });
      } else if (thisPrice > marketValue * 1.1) {
        chips.push({ label: 'Priced above market', type: 'con', source: 'rule' });
      }
    }
  }

  // 5. Listing age chips
  const leftDate = parseDateSafe(leftListing.listingDate);
  const rightDate = parseDateSafe(rightListing.listingDate);
  if (leftDate !== null && rightDate !== null) {
    const diffMs = Math.abs(leftDate.getTime() - rightDate.getTime());
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (diffMs > ONE_DAY_MS) {
      const moreRecentSide: 'left' | 'right' = leftDate > rightDate ? 'left' : 'right';
      if (moreRecentSide === side) {
        chips.push({ label: 'Listed more recently', type: 'pro', source: 'rule' });
      }
    }
  }

  return chips;
}

/**
 * Safely parse a date string. Returns null for undefined, empty, or invalid dates.
 */
function parseDateSafe(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}
