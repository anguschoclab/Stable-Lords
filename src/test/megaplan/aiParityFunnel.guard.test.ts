/**
 * V26 guard — one funnel for fresh warriors.
 *
 * Every production Warrior must be materialized by `makeWarrior` (world
 * mints) or `poolWarriorToWarrior` (signings) — the two constructors that
 * fill the complete meaningful field set. Any other `newWarriorDefaults()`
 * call site is a hand-rolled Warrior literal bypassing the funnel: the V26
 * G1 bug class (generateAIRecruit minted warriors missing favorites,
 * potential, equipment, trainability, handedness).
 *
 * Ceiling is 0 beyond the allowlist; stale entries must be removed.
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectFunnelBypasses } from '../../../scripts/ai-parity-funnel.mjs';

const KNOWN_EXCEPTIONS: { file: string; why: string }[] = [
  {
    file: 'src/engine/factories/warriorFactory.ts',
    why: 'makeWarrior — the blessed world-mint constructor',
  },
  {
    file: 'src/engine/recruitment/signWarrior.ts',
    why: 'poolWarriorToWarrior — the blessed signing-funnel constructor',
  },
];

interface Violation {
  file: string;
  line: number;
  text: string;
}

describe('megaplan: ai-parity funnel guard', () => {
  const { violations } = collectFunnelBypasses() as { violations: Violation[] };

  it('no Warrior literal bypasses the two blessed constructors', () => {
    const novel = violations.filter(
      (v) => !KNOWN_EXCEPTIONS.some((k) => k.file === v.file)
    );
    expect(
      novel,
      `new fresh-warrior literal introduced outside the funnel — route through signWarrior/makeWarrior or allowlist knowingly:\n${novel
        .map((v) => `  ${v.file}:${v.line}  ${v.text.split('\n')[0]}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('every allowlisted constructor still calls newWarriorDefaults (stale entries must go)', () => {
    for (const k of KNOWN_EXCEPTIONS) {
      expect(
        violations.some((v) => v.file === k.file),
        `allowlisted constructor no longer uses newWarriorDefaults: ${k.file} — remove it from KNOWN_EXCEPTIONS`
      ).toBe(true);
    }
  });
});
