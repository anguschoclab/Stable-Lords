import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectSeededIdViolations } from '../../../scripts/seeded-id-scan.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Seeded-id guard — V30 determinism ratchet.
 *
 * Engine code lives inside seeded simulation paths: ids minted there must
 * derive from the seeded stream or deterministic inputs, never
 * generateId()/cryptoRandom/Math.random()/crypto.getRandomValues. Sole
 * allowlist: simulate/initialization.ts's sanctioned unseeded-fight fallback.
 */
describe('seededId guard (V30)', () => {
  it('no unseeded randomness inside src/engine seeded paths', () => {
    const { violations } = collectSeededIdViolations() as {
      violations: { file: string; line: number; rule: string; text: string }[];
    };
    expect(
      violations,
      violations
        .map((v) => `${v.file}:${v.line} [${v.rule}] ${v.text}`)
        .join('\n')
    ).toEqual([]);
  });

  it('the initialization.ts allowlist still pins an actual fallback (stale-allowlist check)', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../../engine/simulate/initialization.ts'),
      'utf8'
    );
    expect(
      src.includes('crypto.getRandomValues'),
      'allowlisted crypto.getRandomValues gone from initialization.ts — remove the allowlist entry'
    ).toBe(true);
  });
});
