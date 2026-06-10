/**
 * Stable Lords — Narrative Template Helpers
 *
 * Shared Handlebars-style interpolation used by the seasonal/event pipeline
 * passes. Unlike {@link interpolateTemplate} (which only resolves a fixed set
 * of combat tokens), this resolves any `{{key}}` present in the supplied data
 * record, leaving unknown tokens untouched.
 */

/**
 * Replaces `{{token}}` placeholders with values from `data`.
 * Tokens whose key is absent from `data` are left unchanged.
 *
 * @param template - Template string containing `{{token}}` placeholders.
 * @param data - Map of token name to substitution value.
 * @returns The interpolated string.
 */
export function interpolateData(
  template: string,
  data: Record<string, string | number>
): string {
  return template.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && Object.hasOwn(data, key) ? String(value) : match;
  });
}
