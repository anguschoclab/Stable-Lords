import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectEntriesInLoop } from '../../../scripts/entries-in-loop.mjs';

/**
 * Entries-in-loop guard — megaplan ratchet.
 *
 * External audit finding: `Object.entries()` inside a loop rebuilds the same
 * entries array once per iteration — when the iterated object is invariant
 * (static registry like TRAITS, or a value bound before the loop) that's pure
 * allocation churn. The scanner (AST-accurate, typescript compiler API) flags
 * every `Object.entries` nested in a loop body or an iterative-method callback.
 *
 * KNOWN_EXCEPTIONS are per-iteration data — the entries genuinely differ each
 * pass and cannot be hoisted. Keyed on file + code substring so line drift
 * doesn't silently break the guard. Ceiling is 0 beyond the allowlist.
 */
const KNOWN_EXCEPTIONS: { file: string; match: string; why: string }[] = [
  {
    file: 'src/engine/traits/mods.ts',
    match: 'Object.entries(def.effect.attrBonus)',
    why: 'module-load precompute over the static TRAITS registry — runs once at import; the map is the fix',
  },
  {
    file: 'src/engine/traits/mods.ts',
    match: 'Object.entries(def.effect.fightPlanMod)',
    why: 'module-load precompute over the static TRAITS registry — runs once at import; the map is the fix',
  },
  {
    file: 'src/engine/injuries/injurySystem.ts',
    match: 'Object.entries(inj.penalties)',
    why: 'inj.penalties is per-injury-instance state — differs every iteration',
  },
  {
    file: 'src/engine/validate/stateInvariants.ts',
    match: 'Object.entries(title.declinedContenders',
    why: 'declinedContenders is per-title state — differs every iteration',
  },
];

interface EntriesViolation {
  file: string;
  line: number;
  text: string;
}

describe('megaplan: entries-in-loop guard', () => {
  const { violations } = collectEntriesInLoop() as { violations: EntriesViolation[] };

  it('no Object.entries() call executes once per loop iteration', () => {
    const novel = violations.filter(
      (v) => !KNOWN_EXCEPTIONS.some((k) => k.file === v.file && v.text.startsWith(k.match))
    );
    expect(
      novel,
      `new entries-in-loop sites introduced — hoist/precompute or extend the allowlist knowingly:\n${novel
        .map((v) => `  ${v.file}:${v.line}  ${v.text.split('\n')[0]}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('every allowlisted exception still exists (stale entries must be removed)', () => {
    for (const k of KNOWN_EXCEPTIONS) {
      expect(
        violations.some((v) => v.file === k.file && v.text.startsWith(k.match)),
        `allowlisted exception no longer found: ${k.file} "${k.match}" — remove it from KNOWN_EXCEPTIONS`
      ).toBe(true);
    }
  });
});
