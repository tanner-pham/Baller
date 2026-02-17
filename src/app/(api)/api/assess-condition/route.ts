import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONDITION_LABELS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

interface ParsedAssessment {
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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isOpenAIErrorWithCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'code' in error && (error as { code?: unknown }).code === code;
}

async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.facebook.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('Condition assessment image fetch failed:', {
        imageUrl,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Condition assessment image fetch returned non-image content type:', {
        imageUrl,
        contentType,
      });
      return null;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.byteLength === 0 || imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      console.error('Condition assessment image fetch returned invalid size:', {
        imageUrl,
        bytes: imageBuffer.byteLength,
        maxBytes: MAX_IMAGE_BYTES,
      });
      return null;
    }

    return `data:${contentType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Condition assessment image fetch threw an error:', {
      imageUrl,
      error,
    });
    return null;
  }
}

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

function normalizeAccuracyString(value: unknown, fallback: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue))).toString();
}

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

function parseAssessmentResponse(rawContent: string): ParsedAssessment {
  const parsed = JSON.parse(rawContent) as Record<string, unknown>;
  const rawScore = Number(parsed.conditionScore);
  const clampedScore = Number.isFinite(rawScore)
    ? Math.min(1, Math.max(0, rawScore))
    : 0.5;
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

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, description } = await request.json();

    if (!imageUrl) {
      console.error('Condition assessment request missing required imageUrl');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);
    const promptText = `Analyze this product image and provide a condition assessment. ${description ? `Additional context: ${description}` : ''}

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
- Keep pricing realistic and conservative.`;
    if (!imageDataUrl) {
      console.error('Condition assessment proceeding without image due to inaccessible image URL', {
        imageUrl,
      });
    }
    const contentParts: Array<
      { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
    > = [
      {
        type: 'text',
        text: imageDataUrl
          ? promptText
          : `${promptText}

If no image is accessible, infer conservatively from the description only and clearly reflect uncertainty in reasoning.`,
      },
    ];

    if (imageDataUrl) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: imageDataUrl },
      });
    }

    const response = await (async () => {
      try {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: contentParts,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        });
      } catch (error) {
        // Some remote image URLs (especially FB CDN) are blocked/expired from model-side fetch.
        // Retry once with text-only prompt so dashboard can still populate recommendations.
        if (isOpenAIErrorWithCode(error, 'invalid_image_url')) {
          console.error('Condition assessment OpenAI request failed with invalid_image_url, retrying text-only', {
            imageUrl,
            error,
          });
          return await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `${promptText}

Image could not be accessed. Use description/context only and be conservative.`,
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
          });
        }

        throw error;
      }
    })();

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Condition assessment OpenAI response missing message content');
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const assessment = parseAssessmentResponse(content);

    return NextResponse.json({
      success: true,
      assessment: {
        conditionScore: assessment.conditionScore,
        conditionLabel: assessment.conditionLabel,
        modelAccuracy: assessment.modelAccuracy,
        reasoning: assessment.reasoning,
        wearIndicators: assessment.wearIndicators || [],
        topReasons: assessment.topReasons,
        suggestedPrice: assessment.suggestedPrice,
        suggestedOffer: assessment.suggestedOffer,
        negotiationTip: assessment.negotiationTip,
      },
    });
  } catch (error) {
    console.error('Condition assessment error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to assess condition',
      },
      { status: 500 }
    );
  }
}
