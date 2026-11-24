const NEEDS_ESCAPE = /[&<>"']/;

/** Escape HTML special characters for safe interpolation into markup. */
export function escapeHtml(str: string): string {
  // Fast path: most template tokens carry no special chars — one test beats
  // five no-op global replaces (each scans + allocates a result string).
  if (!NEEDS_ESCAPE.test(str)) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
