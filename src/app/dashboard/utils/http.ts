/**
 * Reads and parses JSON response bodies while preserving raw text for debugging.
 */
export async function readJsonResponse<T>(
  response: Response,
): Promise<{ payload: T | null; rawText: string }> {
  const rawText = await response.text();

  try {
    return { payload: JSON.parse(rawText) as T, rawText };
  } catch {
    return { payload: null, rawText };
  }
}
