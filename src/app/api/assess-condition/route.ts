import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { fetchImageAsDataUrl } from './image';
import { isOpenAIErrorWithCode, parseAssessmentResponse } from './normalize';
import { buildAssessmentPrompt } from './prompt';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getConditionCacheEntry,
  upsertConditionCacheEntry,
  type ConditionCacheEntry,
} from '../../../lib/server/conditionCacheRepository';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConditionAssessmentPayload {
  conditionScore: number;
  conditionLabel: string;
  modelAccuracy: string;
  reasoning: string;
  wearIndicators: string[];
  topReasons: string[];
  suggestedPrice: string;
  suggestedOffer: string;
  negotiationTip: string;
}

/**
 * Parses a numeric amount from pricing text such as "$1,250".
 */
function parseUsdAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.replace(/[^0-9.]/g, '');

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * Prevents suggested offers from exceeding the listing ask price when available.
 */
function clampAssessmentToListedPrice(
  assessment: ConditionAssessmentPayload,
  listedPrice: string | undefined,
): ConditionAssessmentPayload {
  const listedPriceAmount = parseUsdAmount(listedPrice);
  const suggestedOfferAmount = parseUsdAmount(assessment.suggestedOffer);

  if (
    listedPriceAmount === null ||
    suggestedOfferAmount === null ||
    suggestedOfferAmount <= listedPriceAmount
  ) {
    return assessment;
  }

  return {
    ...assessment,
    suggestedOffer: Math.round(listedPriceAmount).toString(),
  };
}

/**
 * Adds cache-status metadata for observability without changing response JSON contracts.
 */
function withCacheStatus(response: NextResponse, cacheStatus: string): NextResponse {
  response.headers.set('x-cache-status', cacheStatus);
  return response;
}

export async function POST(request: NextRequest) {
  let staleCache: ConditionCacheEntry<ConditionAssessmentPayload> | null = null;
  let requestListedPrice: string | undefined;

  try {
    const body = (await request.json()) as {
      imageUrl?: unknown;
      description?: unknown;
      listingId?: unknown;
      listedPrice?: unknown;
    };

    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const description = typeof body.description === 'string' ? body.description : undefined;
    const listedPrice = typeof body.listedPrice === 'string' ? body.listedPrice : undefined;
    requestListedPrice = listedPrice;
    const listingId =
      typeof body.listingId === 'string' && body.listingId.trim().length > 0
        ? body.listingId.trim()
        : null;

    if (!imageUrl) {
      console.error('Condition assessment request missing required imageUrl');
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (listingId) {
      try {
        const cachedAssessment = await getConditionCacheEntry<ConditionAssessmentPayload>(listingId);

        if (cachedAssessment) {
          if (isCacheFresh(cachedAssessment.computedAt)) {
            const clampedCachedAssessment = clampAssessmentToListedPrice(
              cachedAssessment.assessmentPayload,
              listedPrice,
            );

            console.info('Condition cache hit', {
              listingId,
              computedAt: cachedAssessment.computedAt,
            });

            if (
              clampedCachedAssessment.suggestedOffer !==
              cachedAssessment.assessmentPayload.suggestedOffer
            ) {
              console.info('Condition cache suggestedOffer clamped to listing ask', {
                listingId,
                suggestedOffer: cachedAssessment.assessmentPayload.suggestedOffer,
                clampedTo: clampedCachedAssessment.suggestedOffer,
              });
            }

            return withCacheStatus(
              NextResponse.json({
                success: true,
                assessment: clampedCachedAssessment,
              }),
              'hit',
            );
          }

          staleCache = cachedAssessment;
          console.info('Condition cache stale-hit', {
            listingId,
            computedAt: cachedAssessment.computedAt,
          });
        } else {
          console.info('Condition cache miss', { listingId });
        }
      } catch (caughtError) {
        console.error('Condition cache read failed, continuing to compute', {
          listingId,
          error: caughtError,
        });
      }
    }

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);
    const promptText = buildAssessmentPrompt(description, listedPrice);

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
      } catch (caughtError) {
        // Some FB CDN image URLs cannot be fetched model-side. Retry with text only.
        if (isOpenAIErrorWithCode(caughtError, 'invalid_image_url')) {
          console.error(
            'Condition assessment OpenAI request failed with invalid_image_url, retrying text-only',
            {
              imageUrl,
              error: caughtError,
            },
          );

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

        throw caughtError;
      }
    })();

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('Condition assessment OpenAI response missing message content');

      if (staleCache) {
        const clampedStaleAssessment = clampAssessmentToListedPrice(
          staleCache.assessmentPayload,
          listedPrice,
        );
        console.info('Condition cache stale-fallback used due to empty OpenAI content', {
          listingId: staleCache.listingId,
        });
        return withCacheStatus(
          NextResponse.json({
            success: true,
            assessment: clampedStaleAssessment,
          }),
          'stale-fallback',
        );
      }

      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 });
    }

    const assessment = parseAssessmentResponse(content);

    const responseAssessment = clampAssessmentToListedPrice(
      {
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
      listedPrice,
    );

    if (responseAssessment.suggestedOffer !== assessment.suggestedOffer) {
      console.info('Condition suggestedOffer clamped to listing ask price', {
        listingId,
        originalSuggestedOffer: assessment.suggestedOffer,
        clampedSuggestedOffer: responseAssessment.suggestedOffer,
      });
    }

    if (listingId) {
      try {
        await upsertConditionCacheEntry<ConditionAssessmentPayload>({
          listingId,
          assessmentPayload: responseAssessment,
        });
        console.info('Condition cache fresh-write', { listingId });
      } catch (caughtError) {
        console.error('Condition cache write failed', {
          listingId,
          error: caughtError,
        });
      }
    }

    return withCacheStatus(
      NextResponse.json({
        success: true,
        assessment: responseAssessment,
      }),
      staleCache ? 'stale-refresh' : listingId ? 'miss' : 'compute-no-key',
    );
  } catch (caughtError) {
    console.error('Condition assessment error:', caughtError);

    if (staleCache) {
      const clampedStaleAssessment = clampAssessmentToListedPrice(
        staleCache.assessmentPayload,
        requestListedPrice,
      );
      console.info('Condition cache stale-fallback used due to compute error', {
        listingId: staleCache.listingId,
      });
      return withCacheStatus(
        NextResponse.json({
          success: true,
          assessment: clampedStaleAssessment,
        }),
        'stale-fallback',
      );
    }

    return NextResponse.json(
      {
        error: caughtError instanceof Error ? caughtError.message : 'Failed to assess condition',
      },
      { status: 500 },
    );
  }
}
