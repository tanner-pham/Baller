import { readJsonResponse } from '@/src/app/dashboard/utils/http';

/**
 * Minimal Response shim for jsdom which does not provide the Fetch API Response.
 */
function makeResponse(body: string): Response {
  return { text: () => Promise.resolve(body) } as unknown as Response;
}

describe('readJsonResponse', () => {
  it('parses a valid JSON response and returns payload + rawText', async () => {
    const body = { success: true, value: 42 };
    const response = makeResponse(JSON.stringify(body));

    const result = await readJsonResponse<typeof body>(response);
    expect(result.payload).toEqual(body);
    expect(result.rawText).toBe(JSON.stringify(body));
  });

  it('returns null payload when response body is not valid JSON', async () => {
    const response = makeResponse('this is not json');

    const result = await readJsonResponse(response);
    expect(result.payload).toBeNull();
    expect(result.rawText).toBe('this is not json');
  });

  it('returns null payload for empty body', async () => {
    const response = makeResponse('');

    const result = await readJsonResponse(response);
    expect(result.payload).toBeNull();
    expect(result.rawText).toBe('');
  });

  it('handles complex nested JSON correctly', async () => {
    const body = {
      listing: { title: 'MacBook', price: '$1,200', images: ['a.jpg', 'b.jpg'] },
      meta: { cached: true },
    };
    const response = makeResponse(JSON.stringify(body));

    const result = await readJsonResponse<typeof body>(response);
    expect(result.payload?.listing.title).toBe('MacBook');
    expect(result.payload?.listing.images).toHaveLength(2);
  });
});