/**
 * V23 canon — Pagan, "Warrior Handedness" (Arena 93): an arm hit drops the
 * weapon held in THAT arm's hand. A right-handed fighter cannot lose their
 * weapon to a left-arm hit; an ambidextrous fighter picks their primary
 * side lazily, only when the first arm hit forces the question.
 */
import { describe, it, expect } from 'vitest';
import { tryDisarm } from '@/engine/combat/resolution/disarm';
import { DISARM_UNARMED_WEAPON_ID } from '@/constants/combat';
import { makeFighterState } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { HitLocation } from '@/engine/combat/mechanics/combatDamage';

const armed = (over: Partial<FighterState> = {}): FighterState =>
  makeFighterState({ label: 'D', weaponId: 'broadsword', armHits: 9, hp: 80, ...over });

const disarm = (defender: FighterState, hitLoc: HitLocation, rng = () => 0) => {
  const events: CombatEvent[] = [];
  const fired = tryDisarm({
    events,
    rng,
    defender,
    defLabel: 'D',
    hitLoc,
    damage: 30,
    isCrit: true,
  });
  return { fired, events };
};

describe('weapon-side disarm gating — single weapon (canon)', () => {
  it('a right-handed fighter only drops on right-arm hits', () => {
    const righty = armed({ handedness: 'right' });
    const leftArm = disarm(righty, 'left arm');
    expect(leftArm.fired).toBe(false);
    expect(righty.weaponId).toBe('broadsword');
    expect(righty.droppedWeaponId).toBeUndefined();

    const rightArm = disarm(righty, 'right arm');
    expect(rightArm.fired).toBe(true);
    expect(righty.weaponId).toBe(DISARM_UNARMED_WEAPON_ID);
    expect(righty.droppedWeaponId).toBe('broadsword');
  });

  it('a left-handed fighter only drops on left-arm hits', () => {
    const lefty = armed({ handedness: 'left' });
    const rightArm = disarm(lefty, 'right arm');
    expect(rightArm.fired).toBe(false);
    expect(lefty.weaponId).toBe('broadsword');

    const leftArm = disarm(lefty, 'left arm');
    expect(leftArm.fired).toBe(true);
    expect(lefty.droppedWeaponId).toBe('broadsword');
  });
});

describe('ambidextrous lazy side-pick (canon, Pagan)', () => {
  it('the first arm hit lazily resolves the primary side and records it', () => {
    const ambi = armed({ handedness: 'ambidextrous' });
    expect(ambi.ambiPrimarySide).toBeUndefined(); // undecided until needed
    disarm(ambi, 'right arm', () => 0);
    expect(ambi.ambiPrimarySide).toBeDefined();
  });

  it('the pick is biased right (canon: primary in the right hand)', () => {
    // AMBI_PRIMARY_RIGHT_BIAS — over many picks, right should dominate.
    let right = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const f = armed({ handedness: 'ambidextrous' });
      // Sweep deterministic rng values across the stream — first draw is
      // the disarm roll, subsequent draws resolve the lazy side pick.
      const draws = [0, i / N, 0.5, 0.5, 0.5];
      let k = 0;
      disarm(f, 'right arm', () => draws[Math.min(k++, draws.length - 1)] ?? 0.5);
      if (f.ambiPrimarySide === 'right') right++;
    }
    expect(right / N).toBeGreaterThan(0.6);
  });

  it('a reversed ambi resolves primary in the left', () => {
    const rev = armed({ handedness: 'ambi-reversed' });
    disarm(rev, 'right arm', () => 0);
    expect(rev.ambiPrimarySide).toBe('left');
  });
});

describe('weapon-side gating — dual wield', () => {
  it('striking the off-hand arm drops only the off-hand weapon', () => {
    const dual = armed({
      handedness: 'right',
      offhandWeaponId: 'dagger',
    });
    const { fired } = disarm(dual, 'left arm');
    expect(fired).toBe(true);
    expect(dual.weaponId).toBe('broadsword'); // primary stays
    expect(dual.droppedWeaponId).toBe('dagger');
    expect(dual.offhandWeaponId).toBeUndefined();
  });

  it('striking the primary arm drops only the primary weapon', () => {
    const dual = armed({
      handedness: 'right',
      offhandWeaponId: 'dagger',
    });
    const { fired } = disarm(dual, 'right arm');
    expect(fired).toBe(true);
    expect(dual.droppedWeaponId).toBe('broadsword');
    expect(dual.offhandWeaponId).toBe('dagger'); // off-hand stays
  });
});
