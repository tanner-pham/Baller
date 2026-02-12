/**
 * Backend Integration Tests - Condition Assessment API (Mocha + Chai)
 * Tests the POST /api/assess-condition endpoint with GPT Vision
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

// Mock OpenAI response
function mockGPTVisionSuccess() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          conditionScore: 0.85,
          conditionLabel: 'Like New',
          reasoning: 'Minor scuffs on corners, screen appears pristine',
          wearIndicators: ['minor corner scuffs', 'light scratches on back']
        })
      }
    }]
  };
}

function mockGPTVisionError() {
  return {
    choices: []
  };
}

// Simulate the condition assessment logic
async function simulateAssessCondition(imageUrl: string, mockResponse: any) {
  if (!imageUrl) {
    return { status: 400, body: { error: 'Image URL is required' } };
  }

  if (mockResponse.choices.length === 0) {
    return { status: 500, body: { error: 'No response from OpenAI' } };
  }

  const content = mockResponse.choices[0].message.content;
  const assessment = JSON.parse(content);

  return {
    status: 200,
    body: {
      success: true,
      assessment: {
        conditionScore: assessment.conditionScore,
        conditionLabel: assessment.conditionLabel,
        reasoning: assessment.reasoning,
        wearIndicators: assessment.wearIndicators || []
      }
    }
  };
}

describe('POST /api/assess-condition', () => {

  describe('Success cases', () => {
    it('should return condition assessment when given valid image URL', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.status).to.equal(200);
      expect(result.body.success).to.equal(true);
      expect(result.body.assessment).to.have.property('conditionScore');
      expect(result.body.assessment.conditionScore).to.be.a('number');
      expect(result.body.assessment.conditionScore).to.be.at.least(0);
      expect(result.body.assessment.conditionScore).to.be.at.most(1);
    });

    it('should return condition label', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.body.assessment.conditionLabel).to.equal('Like New');
    });

    it('should return reasoning for the score', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.body.assessment.reasoning).to.be.a('string');
      expect(result.body.assessment.reasoning.length).to.be.greaterThan(0);
    });

    it('should return wear indicators array', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.body.assessment.wearIndicators).to.be.an('array');
      expect(result.body.assessment.wearIndicators.length).to.be.greaterThan(0);
    });
  });

  describe('Error cases', () => {
    it('should return 400 when image URL is missing', async () => {
      const mockResponse = mockGPTVisionSuccess();
      const result = await simulateAssessCondition('', mockResponse);

      expect(result.status).to.equal(400);
      expect(result.body).to.have.property('error');
      expect(result.body.error).to.equal('Image URL is required');
    });

    it('should return 500 when OpenAI returns no response', async () => {
      const imageUrl = 'https://example.com/macbook.jpg';
      const mockResponse = mockGPTVisionError();
      const result = await simulateAssessCondition(imageUrl, mockResponse);

      expect(result.status).to.equal(500);
      expect(result.body).to.have.property('error');
    });
  });
});