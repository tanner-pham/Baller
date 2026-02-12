import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, description } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Call GPT-4 Vision to assess condition
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this product image and provide a condition assessment. ${description ? `Additional context: ${description}` : ''}

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "conditionScore": <number between 0.0 and 1.0>,
  "conditionLabel": "<one of: New, Like New, Good, Fair, Poor>",
  "reasoning": "<brief explanation of visible wear, damage, or condition indicators>",
  "wearIndicators": [<array of specific issues like "scratches on screen", "scuffed corners", etc.>]
}

Scoring guide:
- 0.9-1.0: New/unopened, no signs of use
- 0.7-0.9: Like New, minimal wear
- 0.5-0.7: Good, normal wear but functional
- 0.3-0.5: Fair, noticeable wear/damage
- 0.0-0.3: Poor, significant damage`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const assessment = JSON.parse(content);

    return NextResponse.json({
      success: true,
      assessment: {
        conditionScore: assessment.conditionScore,
        conditionLabel: assessment.conditionLabel,
        reasoning: assessment.reasoning,
        wearIndicators: assessment.wearIndicators || [],
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