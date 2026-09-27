// @vitest-environment jsdom
/**
 * Environment-split canary — proves `// @vitest-environment` pragmas drive the
 * test environment per file. With the global env flipped to 'node', this file
 * must still get a DOM via its pragma. If this file fails, the pragma
 * mechanism is broken and DOM-dependent suites cannot opt in per file.
 */
import { describe, it, expect } from 'vitest';

describe('environment split canary', () => {
  it('this file (jsdom pragma) gets a DOM under the global node env', () => {
    expect(typeof document).toBe('object');
  });

  it('pure engine module works identically under either env', async () => {
    const { enduranceCost } = await import('@/engine/combat/mechanics/combatFatigue');
    expect(enduranceCost({ OE: 5 } as never, 'Striking' as never)).toBeDefined();
  });
});
