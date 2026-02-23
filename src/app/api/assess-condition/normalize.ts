import { CONDITION_LABELS, type ParsedAssessment } from './types';

/**
 * Calculates modelAccuracy score (0-100) based on image count, description quality, and listing age.
 * More images, longer descriptions, and fresher listings increase confidence in the assessment.
 */
export function calculateModelAccuracy(
  images?: string[],
  description?: string,
  postedTime?: string,
): number {
  let score = 30; // baseline score

  // Add points for number of images (max 30 points)
  const imageCount = Array.isArray(images) ? images.filter((img) => img && img.trim()).length : 0;
  const imageScore = Math.min(30, imageCount * 10);
  score += imageScore;

  // Add points for description length (max 30 points)
  const descriptionLength = description ? description.trim().length : 0;
  let descriptionScore = 0;
  if (descriptionLength > 300) {
    descriptionScore = 30;
  } else if (descriptionLength > 150) {
    descriptionScore = 20;
  } else if (descriptionLength > 50) {
    descriptionScore = 15;
  }
  score += descriptionScore;

  // If listing is created within 6 months, increase score by 10 points.
  if (postedTime) {
    try {
      const postedDate = new Date(postedTime);
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

      if (postedDate >= sixMonthsAgo && postedDate <= now) {
        score += 10;
      }
    } catch {
      // If date parsing fails, skip the bonus
    }
  }

  // Cap at 98 to allow room for uncertainty
  return Math.min(98, score);
}

/**
 * Narrowly checks OpenAI errors by code without depending on SDK internals.
 */
export function isOpenAIErrorWithCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'code' in error && (error as { code?: unknown }).code === code;
}

/**
 * Converts numeric/string monetary values to rounded integer-string dollars.
 */
function normalizeMoneyString(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value).toString();
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalizedNumeric = value.replace(/[$,\s]/g, '');

  if (!normalizedNumeric) {
    return fallback;
  }

  const numericValue = Number(normalizedNumeric);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.round(numericValue).toString();
}

/**
 * Ensures model confidence is represented as an integer string between 0 and 100.
 * @deprecated modelAccuracy is now calculated client-side based on images and description length
 */
function normalizeAccuracyString(value: unknown, fallback: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue))).toString();
}

/**
 * Keeps the top reasons list concise and free of empty entries.
 */
function normalizeTopReasons(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/**
 * Parses and normalizes the model JSON payload into a stable API shape.
 */
export function parseAssessmentResponse(rawContent: string): ParsedAssessment {
  const parsed = JSON.parse(rawContent) as Record<string, unknown>;
  const rawScore = Number(parsed.conditionScore);
  const clampedScore = Number.isFinite(rawScore) ? Math.min(1, Math.max(0, rawScore)) : 0.5;
  const normalizedTopReasons = normalizeTopReasons(parsed.topReasons);

  const label = CONDITION_LABELS.includes(parsed.conditionLabel as (typeof CONDITION_LABELS)[number])
    ? (parsed.conditionLabel as (typeof CONDITION_LABELS)[number])
    : 'Good';

  return {
    conditionScore: clampedScore,
    conditionLabel: label,
    reasoning:
      typeof parsed.reasoning === 'string' && parsed.reasoning.trim().length > 0
        ? parsed.reasoning.trim()
        : 'Condition looks average based on the provided image.',
    wearIndicators: Array.isArray(parsed.wearIndicators)
      ? parsed.wearIndicators.filter((item): item is string => typeof item === 'string')
      : [],
    topReasons:
      normalizedTopReasons.length > 0
        ? normalizedTopReasons
        : [
            'Condition indicators in the listing suggest moderate wear and normal use.',
            'Comparable marketplace listings in similar condition support this price range.',
            'Uncertainty in listing details increases downside risk for buyers.',
            'Offer strategy balances fair value with room for negotiation.',
          ],
    suggestedPrice: normalizeMoneyString(parsed.suggestedPrice, '0'),
    suggestedOffer: normalizeMoneyString(parsed.suggestedOffer, '0'),
    negotiationTip:
      typeof parsed.negotiationTip === 'string' && parsed.negotiationTip.trim().length > 0
        ? parsed.negotiationTip.trim()
        : 'Ask politely for flexibility and offer immediate pickup/payment.',
  };
}
