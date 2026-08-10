/**
 * Feature — Arena registration for PR #791.
 * Pre-merge test: will FAIL on main because new arenas
 * (SUN_BAKED_PLATEAU, ANCIENT_AQUEDUCT) don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { getArenaById, getAllArenas } from '@/data/arenas';

describe('arena registration — new arenas from PR #791', () => {
  it('SUN_BAKED_PLATEAU is registered', () => {
    const arena = getArenaById('sun_baked_plateau');
    expect(arena.id).toBe('sun_baked_plateau');
  });

  it('ANCIENT_AQUEDUCT is registered', () => {
    const arena = getArenaById('ancient_aqueduct');
    expect(arena.id).toBe('ancient_aqueduct');
  });

  it('getAllArenas includes SUN_BAKED_PLATEAU', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'sun_baked_plateau')).toBe(true);
  });

  it('getAllArenas includes ANCIENT_AQUEDUCT', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'ancient_aqueduct')).toBe(true);
  });
});
