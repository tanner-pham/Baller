import { buildCompareVerdictPrompt } from '../../src/app/api/compare-verdict/prompt';
import type { CompareVerdictRequest } from '../../src/app/api/compare-verdict/types';

function makeRequest(overrides: Partial<CompareVerdictRequest> = {}): CompareVerdictRequest {
  return {
    leftDescription: 'Left listing description with details about accessories.',
    rightDescription: 'Right listing description with some wear noted.',
    leftPrice: '$500',
    rightPrice: '$650',
    leftTitle: 'iPhone 14 Pro',
    rightTitle: 'iPhone 14 Pro Max',
    leftConditionData: {
      conditionScore: 0.8,
      conditionLabel: 'Like New',
      topReasons: ['Minimal wear', 'Screen intact'],
      suggestedOffer: '$450',
      negotiationTip: 'Offer quick pickup.',
    },
    rightConditionData: {
      conditionScore: 0.6,
      conditionLabel: 'Good',
      topReasons: ['Some scratches', 'Battery health unknown'],
      suggestedOffer: '$550',
      negotiationTip: 'Ask about battery.',
    },
    ...overrides,
  };
}

describe('buildCompareVerdictPrompt', () => {
  it('includes left listing description and right listing description', () => {
    const prompt = buildCompareVerdictPrompt(makeRequest());

    expect(prompt).toContain('Left listing description with details about accessories.');
    expect(prompt).toContain('Right listing description with some wear noted.');
  });

  it('includes condition assessment data (scores, topReasons, suggestedOffers)', () => {
    const prompt = buildCompareVerdictPrompt(makeRequest());

    expect(prompt).toContain('0.8');
    expect(prompt).toContain('Like New');
    expect(prompt).toContain('Minimal wear');
    expect(prompt).toContain('$450');
    expect(prompt).toContain('0.6');
    expect(prompt).toContain('Good');
    expect(prompt).toContain('Some scratches');
    expect(prompt).toContain('$550');
  });

  it('handles missing descriptions gracefully (no crash, includes note about unavailable description)', () => {
    const prompt = buildCompareVerdictPrompt(makeRequest({
      leftDescription: undefined,
      rightDescription: undefined,
    }));

    expect(prompt).toContain('No description available');
    // Should not throw
    expect(typeof prompt).toBe('string');
  });

  it('requests exactly the expected JSON schema fields in instruction', () => {
    const prompt = buildCompareVerdictPrompt(makeRequest());

    expect(prompt).toContain('leftFeaturePros');
    expect(prompt).toContain('leftFeatureCons');
    expect(prompt).toContain('rightFeaturePros');
    expect(prompt).toContain('rightFeatureCons');
    expect(prompt).toContain('verdict');
    expect(prompt).toContain('verdictReasoning');
    expect(prompt).toContain('verdictHeadline');
    expect(prompt).toContain('LEFT_EDGES_AHEAD');
    expect(prompt).toContain('RIGHT_EDGES_AHEAD');
    expect(prompt).toContain('TOO_CLOSE_TO_CALL');
  });
});
