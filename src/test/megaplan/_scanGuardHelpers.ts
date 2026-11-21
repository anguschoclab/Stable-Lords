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

/** Allowlist entry shared by the scanner guards. */
export interface ScanException {
  file: string;
  match: string;
  why: string;
}

/**
 * Assert every allowlisted exception still matches a live violation (stale
 * entries must be removed). Shared by the arenaLookup and scanInLoop guards.
 */
export function assertAllowlistFresh(
  violations: { file: string; text: string }[],
  exceptions: ScanException[],
  norm: (s: string) => string
): void {
  for (const k of exceptions) {
    expect(
      violations.some((v) => v.file === k.file && norm(v.text).startsWith(k.match)),
      `allowlisted exception no longer found: ${k.file} "${k.match}" — remove it from KNOWN_EXCEPTIONS`
    ).toBe(true);
  }
}

/**
 * Assert every exception carries a real reviewed reason (no placeholders).
 * Shared by the arenaLookup and scanInLoop guards.
 */
export function assertExceptionsReviewed(exceptions: ScanException[]): void {
  for (const e of exceptions) {
    expect(e.why.length, `${e.file} ${e.match}`).toBeGreaterThan(20);
    expect(e.why).not.toMatch(/pending triage|todo|fixme|baseline/i);
  }
}

/**
 * Assert a string pool contains no duplicate entries (truncated copies in the
 * failure message). Shared by the V20/V21 narrative-pool uniqueness guards.
 */
export function expectUniqueStrings(pool: string[]): void {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const s of pool) {
    if (seen.has(s)) dupes.push(s.slice(0, 60));
    seen.add(s);
  }
  expect(dupes).toEqual([]);
}
