export function assertSafeFileNamePart(value: string, label: string): void {
  if (!/^[a-zA-Z0-9_.-]+$/.test(value) || value.includes('..')) {
    throw new TypeError(
      `Invalid ${label}: "${value}" contains unsafe characters. Only alphanumeric, underscore, dot, and hyphen are allowed.`
    );
  }
}
