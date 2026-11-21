import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectSeededIdViolations } from '../../../scripts/seeded-id-scan.mjs';
import { assertScanClean } from './_scanGuardHelpers';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Seeded-id guard — V30 determinism ratchet.
 *
 * Engine code lives inside seeded simulation paths: ids minted there must
 * derive from the seeded stream or deterministic inputs, never unseeded
 * sources (generateId, crypto fallbacks, Math's random, getRandomValues).
 * Allowlist: simulate/initialization.ts's sanctioned unseeded-fight fallback,
 * and warriorFactory's rng-less init/test mint (seeded callers pass id or rng).
 */
describe('seededId guard (V30)', () => {
  it('no unseeded randomness inside src/engine seeded paths', () => {
    assertScanClean(collectSeededIdViolations);
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
