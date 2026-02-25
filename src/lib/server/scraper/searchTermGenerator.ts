/**
 * Generate a marketplace search term from a listing title.
 * Uses local heuristics only — no LLM dependency.
 *
 * Ported from tanner-scrapper/src/llm.ts generateSearchTermLocal().
 */
export function generateSearchTermLocal(title: string): string {
  const term = title
    .replace(/[()[\]]/g, ' ')
    .replace(
      /\b(for sale|obo|firm|like new|brand new|great condition|excellent|good condition|must sell|priced to sell)\b/gi,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const words = term.split(/\s+/).filter(Boolean);

  if (words.length <= 6) {
    return term;
  }

  return words.slice(0, 5).join(' ');
}
