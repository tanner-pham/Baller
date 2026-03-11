export const CONDITION_LABELS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

export const SCAM_RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

export interface ParsedAssessment {
  conditionScore: number;
  conditionLabel: (typeof CONDITION_LABELS)[number];
  reasoning: string;
  wearIndicators: string[];
  topReasons: string[];
  suggestedPrice: string;
  suggestedOffer: string;
  negotiationTip: string;
  scamRiskScore: number;
  scamRiskLevel: (typeof SCAM_RISK_LEVELS)[number];
  scamRedFlags: string[];
}
