/**
 * Weapon charting — the per-weapon swings/crits/knockdowns ledger that lets
 * players deduce a hidden favorite weapon from bout statistics (the classic
 * Noblish Island "charting" method).
 */
import { describe, it, expect } from 'vitest';
import {
  recordWeaponSwing,
  recordWeaponCrit,
  recordWeaponKnockdown,
} from '@/engine/combat/resolution/weaponChart';
import { makeFighterState } from '@/test/_fixtures/factories';
import { makeFlatWarrior } from '@/test/_fixtures/determinism';
import { runNarratedVsHeadless } from '@/test/_fixtures/narratedVsHeadless';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorFavorites } from '@/types/warrior.types';

const fav = (weaponId: string): WarriorFavorites => ({
  weaponId,
  rhythm: { oe: 7, al: 6 },
  discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
});

describe('weaponChart tally helpers', () => {
  it('counts swings, crits, and knockdowns under the weapon actually swung', () => {
    const f = makeFighterState({ weaponId: 'warhammer' });
    recordWeaponSwing(f);
    recordWeaponSwing(f);
    recordWeaponCrit(f);
    recordWeaponKnockdown(f);
    expect(f.weaponChart?.warhammer).toEqual({ swings: 2, crits: 1, knockdowns: 1 });
  });

  it('attributes tallies per weapon across a disarm weapon swap', () => {
    const f = makeFighterState({ weaponId: 'warhammer' });
    recordWeaponSwing(f);
    recordWeaponCrit(f);
    f.weaponId = 'fist';
    recordWeaponSwing(f);
    recordWeaponKnockdown(f);
    expect(f.weaponChart?.warhammer).toEqual({ swings: 1, crits: 1, knockdowns: 0 });
    expect(f.weaponChart?.fist).toEqual({ swings: 1, crits: 0, knockdowns: 1 });
  });
});

describe('weaponChart through simulateFight', () => {
  it('accumulates swings per fighter on the outcome', () => {
    const A = makeFlatWarrior('A', FightingStyle.BashingAttack, 15, 42);
    const D = makeFlatWarrior('D', FightingStyle.TotalParry, 15, 43);
    const out = runNarratedVsHeadless(A, D, 42).headless;
    const swingsA = Object.values(out.post?.weaponChartA ?? {}).reduce(
      (sum, r) => sum + r.swings,
      0
    );
    expect(swingsA).toBeGreaterThan(0);
  });

  it('a hidden favorite weapon produces a chartable crit signal', () => {
    // Bashing Attack has zero baseline crit chance — any crit in the ledger
    // means the always-on favorite edge fired, before any discovery.
    const A = makeFlatWarrior('A', FightingStyle.BashingAttack, 15, 7);
    const D = makeFlatWarrior('D', FightingStyle.TotalParry, 15, 8);
    const equipped = A.equipment?.weapon ?? 'broadsword';
    A.favorites = fav(equipped);

    let crits = 0;
    let swings = 0;
    for (const seed of [42, 777, 2024, 9001, 5]) {
      const out = runNarratedVsHeadless(A, D, seed).headless;
      const row = out.post?.weaponChartA?.[equipped];
      crits += row?.crits ?? 0;
      swings += row?.swings ?? 0;
    }
    expect(swings).toBeGreaterThan(10);
    expect(crits).toBeGreaterThan(0);
  });
});
