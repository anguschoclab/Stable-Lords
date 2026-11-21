import { expect } from 'vitest';

/** Violation shape shared by the scripts/*.mjs scanners. */
export interface ScanViolation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

/**
 * Assert a scanner's violation list is empty, printing each violation so the
 * failure message is self-explanatory. Used by the V30 scanner guards.
 */
export function assertScanClean(collect: () => { violations: ScanViolation[] }): void {
  const { violations } = collect();
  expect(
    violations,
    violations.map((v) => `${v.file}:${v.line} [${v.rule}] ${v.text}`).join('\n')
  ).toEqual([]);
}
