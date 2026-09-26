/**
 * Environment-split canary — proves `// @vitest-environment` pragmas drive the
 * test environment per file, the mechanism the Phase-5 env flip relies on.
 * If this file fails, do NOT flip the global environment to 'node'.
 */
import { describe, it, expect } from 'vitest';

describe('environment split canary', () => {
  it('this file (no pragma) runs under the configured global env (jsdom)', () => {
    expect(typeof document).toBe('object');
  });

  it('pure engine module works identically under either env', async () => {
    const { enduranceCost } = await import('@/engine/combat/mechanics/combatFatigue');
    expect(enduranceCost({ OE: 5 } as never, 'Striking' as never)).toBeDefined();
  });
});
