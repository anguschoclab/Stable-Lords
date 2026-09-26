// @vitest-environment node
/**
 * Node-environment canary — the counterpart to environmentSplitCanary. If this
 * file fails, per-file node environments are broken and the global env must
 * NOT be flipped to 'node'.
 */
import { describe, it, expect } from 'vitest';

describe('node environment canary', () => {
  it('runs without a DOM', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
  });

  it('pure engine module works under node env', async () => {
    const { enduranceCost } = await import('@/engine/combat/mechanics/combatFatigue');
    expect(enduranceCost({ OE: 5 } as never, 'Striking' as never)).toBeDefined();
  });
});
