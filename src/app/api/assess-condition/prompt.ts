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
  "modelAccuracy": "<integer from 0 to 100>",
  "topReasons": [<array of 2-4 concise bullets explaining the pricing logic>],
  "suggestedPrice": "<integer string in USD, no symbols, e.g. '8500'>",
  "suggestedOffer": "<integer string in USD, no symbols, e.g. '7800'>",
  "negotiationTip": "<1-2 sentence practical negotiation advice>"
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
- If listing ask price is provided, suggestedOffer must not exceed that ask price.`;
}
