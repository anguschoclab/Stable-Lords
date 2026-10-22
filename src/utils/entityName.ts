/**
 * Entity-name sanitizer — allowlist for user-controlled entity names.
 * Keeps letters (any script), digits, spaces, apostrophes, hyphens,
 * periods, and commas; strips everything else, including all
 * markdown/HTML metacharacters that could corrupt gazette linkification.
 */

const ENTITY_NAME_MAX_LEN = 40;

const DISALLOWED_CHARS = /[^\p{L}\p{N} '’\-.,]/gu;

/**
 * Sanitizes a raw entity name (warrior, stable, owner, etc.).
 * Returns the cleaned name, or `''` when nothing usable remains —
 * callers decide whether to reject or fall back.
 */
export function sanitizeEntityName(raw: string): string {
  return raw
    .replace(DISALLOWED_CHARS, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, ENTITY_NAME_MAX_LEN);
}
