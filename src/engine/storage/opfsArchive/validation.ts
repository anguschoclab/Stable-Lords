/** Throws when a filename segment contains characters outside the safe set (path-traversal guard). */
export function assertSafeFileNamePart(value: string, label: string): void {
  if (!/^[a-zA-Z0-9_.-]+$/.test(value) || value.includes('..')) {
    throw new TypeError(
      `Invalid ${label}: "${value}" contains unsafe characters. Only alphanumeric, underscore, dot, and hyphen are allowed.`
    );
  }
}
