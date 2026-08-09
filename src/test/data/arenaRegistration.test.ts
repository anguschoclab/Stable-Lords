/**
 * Feature — Arena registration for PR #791.
 * Pre-merge test: will FAIL on main because new arenas
 * (SUN_BAKED_PLATEAU, ANCIENT_AQUEDUCT) don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { getArenaById, getAllArenas } from '@/data/arenas';

describe('arena registration — new arenas from PR #791', () => {
  it('SUN_BAKED_PLATEAU is registered', () => {
    const arena = getArenaById('SUN_BAKED_PLATEAU');
    expect(arena.id).toBe('SUN_BAKED_PLATEAU');
  });

  it('ANCIENT_AQUEDUCT is registered', () => {
    const arena = getArenaById('ANCIENT_AQUEDUCT');
    expect(arena.id).toBe('ANCIENT_AQUEDUCT');
  });

  it('getAllArenas includes SUN_BAKED_PLATEAU', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'SUN_BAKED_PLATEAU')).toBe(true);
  });

  it('getAllArenas includes ANCIENT_AQUEDUCT', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'ANCIENT_AQUEDUCT')).toBe(true);
  });
});
