/**
 * Megaplan Phase 4 — `eligibleArenasFor`: tier/fame gating, tournament-ground
 * exclusion, and hazardous-weather indoor fallback for world bookings.
 */
import { describe, it, expect } from 'vitest';
import { eligibleArenasFor } from '@/engine/matchmaking/arenaFit';
import { getAllArenas, getArenasByTag } from '@/data/arenas';
import { ARENA_SELECTION } from '@/constants/arena';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

const w = (over: Partial<Warrior> = {}) =>
  makeWarrior({ id: 'w1' as WarriorId, fame: 0, ...over } as never);

const tiers = () => {
  const excluded = new Set<string>(ARENA_SELECTION.EXCLUDED_ARENA_IDS);
  const all = getAllArenas().filter((a) => !excluded.has(a.id));
  return {
    t1: all.filter((a) => a.tier === 1),
    t2: all.filter((a) => a.tier === 2),
    t3: all.filter((a) => a.tier === 3),
  };
};

describe('eligibleArenasFor', () => {
  it('excludes tournament-only grounds', () => {
    const eligible = eligibleArenasFor(w({ fame: 999 }));
    for (const id of ARENA_SELECTION.EXCLUDED_ARENA_IDS) {
      expect(eligible.some((a) => a.id === id)).toBe(false);
    }
  });

  it('tier-1 venues are always eligible regardless of fame', () => {
    const { t1 } = tiers();
    const eligible = eligibleArenasFor(w({ fame: 0 }));
    for (const a of t1) expect(eligible).toContainEqual(a);
  });

  it('gates tier-2 venues behind TIER_2_FAME_THRESHOLD', () => {
    const { t2 } = tiers();
    if (t2.length === 0) return; // registry has no tier-2 venues
    const under = eligibleArenasFor(w({ fame: ARENA_SELECTION.TIER_2_FAME_THRESHOLD - 1 })).map(
      (a) => a.id
    );
    const at = eligibleArenasFor(w({ fame: ARENA_SELECTION.TIER_2_FAME_THRESHOLD })).map(
      (a) => a.id
    );
    for (const a of t2) {
      expect(under).not.toContain(a.id);
      expect(at).toContain(a.id);
    }
  });

  it('gates tier-3 venues behind TIER_3_FAME_THRESHOLD or champion status', () => {
    const { t3 } = tiers();
    if (t3.length === 0) return;
    const under = eligibleArenasFor(w({ fame: ARENA_SELECTION.TIER_3_FAME_THRESHOLD - 1 })).map(
      (a) => a.id
    );
    for (const a of t3) expect(under).not.toContain(a.id);

    const famed = eligibleArenasFor(w({ fame: ARENA_SELECTION.TIER_3_FAME_THRESHOLD })).map(
      (a) => a.id
    );
    const champion = eligibleArenasFor(w({ fame: 0, champion: true })).map((a) => a.id);
    const titled = eligibleArenasFor(w({ fame: 0, titles: ['arena_champion'] })).map((a) => a.id);
    for (const a of t3) {
      expect(famed).toContain(a.id);
      expect(champion).toContain(a.id);
      expect(titled).toContain(a.id);
    }
  });

  it('excludes outdoor venues under hazardous weather when an indoor venue exists', () => {
    const indoorIds = new Set(getArenasByTag('indoor').map((a) => a.id));
    expect(indoorIds.size).toBeGreaterThan(0);
    const eligible = eligibleArenasFor(w({ fame: 999 }), { weather: 'Blizzard' });
    expect(eligible.length).toBeGreaterThan(0);
    for (const a of eligible) expect(indoorIds.has(a.id)).toBe(true);
  });
});
