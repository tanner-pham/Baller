import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  calculateModelAccuracy,
  isOpenAIErrorWithCode,
  parseAssessmentResponse,
} from '../../src/app/api/assess-condition/normalize';

describe('calculateModelAccuracy', () => {
  it('returns baseline 30 when no inputs provided', () => {
    expect(calculateModelAccuracy()).to.equal(30);
  });

  it('adds 10 points per image up to max 30', () => {
    expect(calculateModelAccuracy(['a.jpg'])).to.equal(40); // 30 + 10
    expect(calculateModelAccuracy(['a.jpg', 'b.jpg', 'c.jpg'])).to.equal(60); // 30 + 30
    // 5 images should still cap at 30 image points
    expect(calculateModelAccuracy(['a', 'b', 'c', 'd', 'e'])).to.equal(60);
  });

  it('adds description length points (15 for 51-150 chars, 20 for 151-300, 30 for 300+)', () => {
    const short = 'x'.repeat(60); // > 50
    expect(calculateModelAccuracy(undefined, short)).to.equal(45); // 30 + 15

    const medium = 'x'.repeat(200); // > 150
    expect(calculateModelAccuracy(undefined, medium)).to.equal(50); // 30 + 20

    const long = 'x'.repeat(400); // > 300
    expect(calculateModelAccuracy(undefined, long)).to.equal(60); // 30 + 30
  });

  it('adds 10 points for recent posted time (within 6 months)', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1);
    expect(calculateModelAccuracy(undefined, undefined, recentDate.toISOString())).to.equal(40);
  });

  it('does not add bonus for old posted time (older than 6 months)', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 1);
    expect(calculateModelAccuracy(undefined, undefined, oldDate.toISOString())).to.equal(30);
  });

  it('caps at 98', () => {
    // 3 images (30) + long desc (30) + recent date (10) + baseline (30) = 100 -> capped to 98
    const longDesc = 'x'.repeat(400);
    const recent = new Date().toISOString();
    expect(calculateModelAccuracy(['a', 'b', 'c'], longDesc, recent)).to.equal(98);
  });

  it('skips empty/whitespace image strings', () => {
    expect(calculateModelAccuracy(['a.jpg', '', '  '])).to.equal(40); // only 1 valid = 30+10
  });

  it('handles invalid date string gracefully', () => {
    expect(calculateModelAccuracy(undefined, undefined, 'not-a-date')).to.equal(30);
  });
});

describe('isOpenAIErrorWithCode', () => {
  it('returns true when error has matching code', () => {
    const error = { code: 'invalid_image_url', message: 'bad image' };
    expect(isOpenAIErrorWithCode(error, 'invalid_image_url')).to.equal(true);
  });

  it('returns false when error has different code', () => {
    const error = { code: 'rate_limit', message: 'slow down' };
    expect(isOpenAIErrorWithCode(error, 'invalid_image_url')).to.equal(false);
  });

  it('returns false for null', () => {
    expect(isOpenAIErrorWithCode(null, 'invalid_image_url')).to.equal(false);
  });

  it('returns false for non-object', () => {
    expect(isOpenAIErrorWithCode('string error', 'invalid_image_url')).to.equal(false);
  });
});

describe('parseAssessmentResponse', () => {
  const validPayload = {
    conditionScore: 0.85,
    conditionLabel: 'Like New',
    reasoning: 'Looks great with minimal wear.',
    wearIndicators: ['minor scratch on corner'],
    topReasons: ['Clean screen', 'No dents', 'Original box'],
    suggestedPrice: '$950',
    suggestedOffer: '$850',
    negotiationTip: 'Offer quick cash pickup.',
  };

  it('parses a well-formed payload correctly', () => {
    const result = parseAssessmentResponse(JSON.stringify(validPayload));
    expect(result.conditionScore).to.equal(0.85);
    expect(result.conditionLabel).to.equal('Like New');
    expect(result.reasoning).to.equal('Looks great with minimal wear.');
    expect(result.topReasons).to.deep.equal(['Clean screen', 'No dents', 'Original box']);
    expect(result.suggestedPrice).to.equal('950');
    expect(result.suggestedOffer).to.equal('850');
    expect(result.negotiationTip).to.equal('Offer quick cash pickup.');
  });

  it('clamps conditionScore to [0, 1]', () => {
    const over = parseAssessmentResponse(JSON.stringify({ ...validPayload, conditionScore: 5 }));
    expect(over.conditionScore).to.equal(1);

    const under = parseAssessmentResponse(JSON.stringify({ ...validPayload, conditionScore: -2 }));
    expect(under.conditionScore).to.equal(0);
  });

  it('defaults conditionScore to 0.5 for non-numeric values', () => {
    const result = parseAssessmentResponse(JSON.stringify({ ...validPayload, conditionScore: 'bad' }));
    expect(result.conditionScore).to.equal(0.5);
  });

  it('defaults conditionLabel to "Good" for unrecognized labels', () => {
    const result = parseAssessmentResponse(JSON.stringify({ ...validPayload, conditionLabel: 'Pristine' }));
    expect(result.conditionLabel).to.equal('Good');
  });

  it('provides fallback reasoning when missing', () => {
    const result = parseAssessmentResponse(JSON.stringify({ ...validPayload, reasoning: '' }));
    expect(result.reasoning).to.include('Condition looks average');
  });

  it('provides default topReasons when empty', () => {
    const result = parseAssessmentResponse(JSON.stringify({ ...validPayload, topReasons: [] }));
    expect(result.topReasons).to.have.length(4);
  });

  it('truncates topReasons to at most 4', () => {
    const payload = { ...validPayload, topReasons: ['a', 'b', 'c', 'd', 'e', 'f'] };
    const result = parseAssessmentResponse(JSON.stringify(payload));
    expect(result.topReasons).to.have.length(4);
  });

  it('provides fallback negotiation tip when missing', () => {
    const result = parseAssessmentResponse(JSON.stringify({ ...validPayload, negotiationTip: '' }));
    expect(result.negotiationTip).to.include('Ask politely');
  });
});