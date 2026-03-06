import { parseVerdictResponse } from '../../src/app/api/compare-verdict/normalize';
import type { VerdictResult } from '../../src/app/api/compare-verdict/types';

describe('parseVerdictResponse', () => {
  it('valid complete JSON parses correctly with all fields populated', () => {
    const raw = JSON.stringify({
      leftFeaturePros: ['Includes original charger', 'Minimal scratches'],
      leftFeatureCons: ['Older model year'],
      rightFeaturePros: ['Larger screen', 'Better camera'],
      rightFeatureCons: ['Noticeable wear on corners', 'Missing accessories'],
      verdict: 'LEFT_EDGES_AHEAD',
      verdictReasoning: 'Left listing offers better overall value with lower price and similar condition.',
      verdictHeadline: 'Left edges ahead on value',
    });

    const result = parseVerdictResponse(raw);

    expect(result.leftFeaturePros).toEqual(['Includes original charger', 'Minimal scratches']);
    expect(result.leftFeatureCons).toEqual(['Older model year']);
    expect(result.rightFeaturePros).toEqual(['Larger screen', 'Better camera']);
    expect(result.rightFeatureCons).toEqual(['Noticeable wear on corners', 'Missing accessories']);
    expect(result.verdict).toBe('LEFT_EDGES_AHEAD');
    expect(result.verdictReasoning).toBe('Left listing offers better overall value with lower price and similar condition.');
    expect(result.verdictHeadline).toBe('Left edges ahead on value');
  });

  it('missing leftFeaturePros defaults to empty array', () => {
    const raw = JSON.stringify({
      leftFeatureCons: ['Some wear'],
      rightFeaturePros: ['Good screen'],
      rightFeatureCons: [],
      verdict: 'RIGHT_EDGES_AHEAD',
      verdictReasoning: 'Right is the better deal.',
      verdictHeadline: 'Right wins',
    });

    const result = parseVerdictResponse(raw);

    expect(result.leftFeaturePros).toEqual([]);
  });

  it('verdict field with invalid value defaults to "TOO_CLOSE_TO_CALL"', () => {
    const raw = JSON.stringify({
      leftFeaturePros: [],
      leftFeatureCons: [],
      rightFeaturePros: [],
      rightFeatureCons: [],
      verdict: 'INVALID_VERDICT',
      verdictReasoning: 'Some reasoning.',
      verdictHeadline: 'Some headline',
    });

    const result = parseVerdictResponse(raw);

    expect(result.verdict).toBe('TOO_CLOSE_TO_CALL');
  });

  it('verdictReasoning missing defaults to a generic explanation', () => {
    const raw = JSON.stringify({
      leftFeaturePros: [],
      leftFeatureCons: [],
      rightFeaturePros: [],
      rightFeatureCons: [],
      verdict: 'TOO_CLOSE_TO_CALL',
      verdictHeadline: 'Close call',
    });

    const result = parseVerdictResponse(raw);

    expect(result.verdictReasoning).toBe('Both listings present comparable value.');
  });

  it('feature arrays longer than 3 items are capped at 3', () => {
    const raw = JSON.stringify({
      leftFeaturePros: ['A', 'B', 'C', 'D', 'E'],
      leftFeatureCons: ['X', 'Y', 'Z', 'W'],
      rightFeaturePros: ['One', 'Two', 'Three', 'Four'],
      rightFeatureCons: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      verdict: 'LEFT_EDGES_AHEAD',
      verdictReasoning: 'Left is better.',
      verdictHeadline: 'Left wins',
    });

    const result = parseVerdictResponse(raw);

    expect(result.leftFeaturePros).toHaveLength(3);
    expect(result.leftFeatureCons).toHaveLength(3);
    expect(result.rightFeaturePros).toHaveLength(3);
    expect(result.rightFeatureCons).toHaveLength(3);
  });

  it('completely malformed JSON (not parseable) returns safe defaults', () => {
    const result = parseVerdictResponse('this is not json at all {{{');

    expect(result.leftFeaturePros).toEqual([]);
    expect(result.leftFeatureCons).toEqual([]);
    expect(result.rightFeaturePros).toEqual([]);
    expect(result.rightFeatureCons).toEqual([]);
    expect(result.verdict).toBe('TOO_CLOSE_TO_CALL');
    expect(result.verdictReasoning).toBe('Both listings present comparable value.');
    expect(result.verdictHeadline).toBe('Too close to call');
  });

  it('empty string arrays are preserved as empty (not filled with defaults)', () => {
    const raw = JSON.stringify({
      leftFeaturePros: [],
      leftFeatureCons: [],
      rightFeaturePros: [],
      rightFeatureCons: [],
      verdict: 'TOO_CLOSE_TO_CALL',
      verdictReasoning: 'Both are fine.',
      verdictHeadline: 'Even match',
    });

    const result = parseVerdictResponse(raw);

    expect(result.leftFeaturePros).toEqual([]);
    expect(result.leftFeatureCons).toEqual([]);
    expect(result.rightFeaturePros).toEqual([]);
    expect(result.rightFeatureCons).toEqual([]);
  });
});
