import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectArenaLookupScans } from '../../../scripts/arena-lookup-scan.mjs';

/**
 * Arena-lookup guard — megaplan ratchet.
 *
 * External audit finding: `getAllArenas().find(a => a.id === x)` allocates a
 * fresh arena array (getAllArenas copies its cache) then scans it O(N) — and
 * inside a map() callback it goes N+1. `getArenaById()` (default-arena
 * fallback) and `tryGetArenaById()` (undefined for unknown ids) are O(1) Map
 * lookups. The scanner (AST-accurate, typescript compiler API) flags
 * `.find`/`.findIndex` riding on any arena-list getter, including receivers
 * chained through `.filter()/.slice()/.map()/.concat()`.
 *
 * KNOWN_EXCEPTIONS are reviewed LEGITIMATE scans only — the escape hatch for
 * a future call site that genuinely needs the array. Keyed on file + code
 * substring so line drift doesn't silently break the guard. Ceiling is 0
 * beyond the list.
 */
const KNOWN_EXCEPTIONS: { file: string; match: string; why: string }[] = [];

interface ScanViolation {
  file: string;
  line: number;
  text: string;
}

describe('megaplan: arena-lookup guard', () => {
  const { violations } = collectArenaLookupScans() as { violations: ScanViolation[] };
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

  it('no linear .find/.findIndex lookups on arena-list getters beyond reviewed exceptions', () => {
    const novel = violations.filter(
      (v) => !KNOWN_EXCEPTIONS.some((k) => k.file === v.file && norm(v.text).startsWith(k.match))
    );
    expect(
      novel,
      `new arena-list linear lookups introduced — use getArenaById/tryGetArenaById or extend the allowlist knowingly:\n${novel
        .map((v) => `  ${v.file}:${v.line}  ${v.text.split('\n')[0]}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('every allowlisted exception still exists (stale entries must be removed)', () => {
    for (const k of KNOWN_EXCEPTIONS) {
      expect(
        violations.some((v) => v.file === k.file && norm(v.text).startsWith(k.match)),
        `allowlisted exception no longer found: ${k.file} "${k.match}" — remove it from KNOWN_EXCEPTIONS`
      ).toBe(true);
    }
  });

  it('every exception carries a reviewed reason (no placeholders)', () => {
    for (const e of KNOWN_EXCEPTIONS) {
      expect(e.why.length, `${e.file} ${e.match}`).toBeGreaterThan(20);
      expect(e.why).not.toMatch(/pending triage|todo|fixme|baseline/i);
    }
  });
});
