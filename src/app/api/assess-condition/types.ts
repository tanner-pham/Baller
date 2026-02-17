export const CONDITION_LABELS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

export interface ParsedAssessment {
  conditionScore: number;
  conditionLabel: (typeof CONDITION_LABELS)[number];
  reasoning: string;
  wearIndicators: string[];
  modelAccuracy: string;
  topReasons: string[];
  suggestedPrice: string;
  suggestedOffer: string;
  negotiationTip: string;
}
