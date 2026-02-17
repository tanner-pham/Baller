import { CONDITION_LABELS, type ParsedAssessment } from './types';

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
    modelAccuracy: normalizeAccuracyString(parsed.modelAccuracy, '85'),
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
