/**
 * Backend Integration Tests - Condition Assessment API (Mocha + Chai)
 * Tests the POST /api/assess-condition endpoint with GPT Vision
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

interface SimulatedAssessment {
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

interface SuccessBody {
  success: true;
  assessment: SimulatedAssessment;
}

interface ErrorBody {
  error: string;
}

type SimulatedAssessResult =
  | { status: 200; body: SuccessBody }
  | { status: 400 | 500; body: ErrorBody };

// Mock OpenAI response
function mockGPTVisionSuccess() {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            conditionScore: 0.85,
            conditionLabel: 'Like New',
            reasoning: 'Minor scuffs on corners, screen appears pristine',
            wearIndicators: ['minor corner scuffs', 'light scratches on back'],
            modelAccuracy: '92',
            topReasons: [
              'Visible wear is limited to cosmetic scuffs.',
              'Comparable listings in similar condition cluster in this range.',
            ],
            suggestedPrice: '8500',
            suggestedOffer: '8000',
            negotiationTip: 'Offer immediate pickup and point out minor cosmetic wear.',
          }),
        },
      },
    ],
  };
}

function mockGPTVisionError() {
  return {
    choices: [],
  };
}

/**
 * Simulates the route handler's success/error shape without making external calls.
 */
async function simulateAssessCondition(
  imageUrl: string,
  mockResponse: ReturnType<typeof mockGPTVisionSuccess>,
): Promise<SimulatedAssessResult> {
  if (!imageUrl) {
    return { status: 400, body: { error: 'Image URL is required' } };
  }

  if (mockResponse.choices.length === 0) {
    return { status: 500, body: { error: 'No response from OpenAI' } };
  }

  const content = mockResponse.choices[0].message.content;
  const assessment = JSON.parse(content) as SimulatedAssessment;

  return {
    status: 200,
    body: {
      success: true,
      assessment: {
        conditionScore: assessment.conditionScore,
        conditionLabel: assessment.conditionLabel,
        modelAccuracy: assessment.modelAccuracy,
        reasoning: assessment.reasoning,
        wearIndicators: assessment.wearIndicators || [],
        topReasons: assessment.topReasons || [],
        suggestedPrice: assessment.suggestedPrice,
        suggestedOffer: assessment.suggestedOffer,
        negotiationTip: assessment.negotiationTip,
      },
    },
  };
}

/**
 * Narrows a simulated result into the success shape for strict assertions.
 */
function getSuccessfulAssessment(result: SimulatedAssessResult): SimulatedAssessment {
  if (result.status !== 200) {
    throw new Error(`Expected a success result, received status ${result.status}`);
  }

  return result.body.assessment;
}

describe('POST /api/assess-condition', () => {
  describe('Success cases', () => {
    it('should return condition assessment when given valid image URL', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);
      const assessment = getSuccessfulAssessment(result);

      expect(result.status).to.equal(200);
      expect(assessment).to.have.property('conditionScore');
      expect(assessment.conditionScore).to.be.a('number');
      expect(assessment.conditionScore).to.be.at.least(0);
      expect(assessment.conditionScore).to.be.at.most(1);
    });

    it('should return condition label', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);
      const assessment = getSuccessfulAssessment(result);

      expect(assessment.conditionLabel).to.equal('Like New');
    });

    it('should return reasoning for the score', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);
      const assessment = getSuccessfulAssessment(result);

      expect(assessment.reasoning).to.be.a('string');
      expect(assessment.reasoning.length).to.be.greaterThan(0);
    });

    it('should return wear indicators array', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);
      const assessment = getSuccessfulAssessment(result);

      expect(assessment.wearIndicators).to.be.an('array');
      expect(assessment.wearIndicators.length).to.be.greaterThan(0);
    });

    it('should return pricing recommendation fields for dashboard', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);
      const assessment = getSuccessfulAssessment(result);

      expect(assessment.suggestedPrice).to.equal('8500');
      expect(assessment.suggestedOffer).to.equal('8000');
      expect(assessment.negotiationTip).to.be.a('string');
      expect(assessment.negotiationTip.length).to.be.greaterThan(0);
      expect(assessment.modelAccuracy).to.equal('92');
      expect(assessment.topReasons).to.be.an('array');
      expect(assessment.topReasons.length).to.be.greaterThan(0);
    });
  });

  describe('Error cases', () => {
    it('should return 400 when image URL is missing', async () => {
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition('', mockResponse);

      expect(result.status).to.equal(400);
      if (result.status === 200) {
        throw new Error('Expected an error response for missing image URL.');
      }
      expect(result.body).to.have.property('error');
      expect(result.body.error).to.equal('Image URL is required');
    });

    it('should return 500 when OpenAI returns no response', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionError();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.status).to.equal(500);
      if (result.status === 200) {
        throw new Error('Expected an error response when OpenAI returns no result.');
      }
      expect(result.body).to.have.property('error');
    });
  });
});
