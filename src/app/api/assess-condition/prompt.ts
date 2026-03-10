/**
 * Builds the model instruction block and optional user-provided listing context.
 */
export function buildAssessmentPrompt(description?: string, listedPrice?: string): string {
  const contextParts = [
    description ? `Additional context: ${description}` : '',
    listedPrice ? `Current listing ask price: ${listedPrice}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `Analyze this product image and provide a condition assessment. ${contextParts}

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "conditionScore": <number between 0.0 and 1.0>,
  "conditionLabel": "<one of: New, Like New, Good, Fair, Poor>",
  "reasoning": "<brief explanation of visible wear, damage, or condition indicators>",
  "wearIndicators": [<array of specific issues like "scratches on screen", "scuffed corners", etc.>],
  "topReasons": [<array of 2-4 concise bullets explaining the pricing logic>],
  "suggestedPrice": "<integer string in USD, no symbols, e.g. '8500'>",
  "suggestedOffer": "<integer string in USD, no symbols, e.g. '7800'>",
  "negotiationTip": "<1-2 sentence practical negotiation advice>",
  "scamRiskScore": <number between 0.0 and 1.0>,
  "scamRiskLevel": "<one of: Low, Medium, High>",
  "scamRedFlags": [<array of 0-4 specific risk indicators found>]
}

Scoring guide:
- 0.9-1.0: New/unopened, no signs of use
- 0.7-0.9: Like New, minimal wear
- 0.5-0.7: Good, normal wear but functional
- 0.3-0.5: Fair, noticeable wear/damage
- 0.0-0.3: Poor, significant damage

Pricing guidance:
- Use product category, visible condition, and provided context.
- Keep pricing realistic and conservative.
- If listing ask price is provided, suggestedOffer must not exceed that ask price.

Scam risk guidance:
- 0.0-0.3 (Low): Listing appears legitimate with realistic photos, fair pricing, and detailed description.
- 0.3-0.6 (Medium): Some concerns such as stock-looking photos, vague description, or slightly suspicious pricing.
- 0.6-1.0 (High): Strong red flags such as price far below market value, stock/stolen images, no real product photos, or description inconsistent with images.
- Common red flags to check: stock or watermarked photos, price too good to be true, very short or copy-pasted description, mismatch between image and description, brand new high-value item at suspiciously low price, no real product photos visible.
- If no red flags are found, return an empty array and Low risk.`;
}
