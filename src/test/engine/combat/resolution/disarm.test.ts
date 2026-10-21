/**
 * Disarm mechanic — arm hits can knock the weapon loose; the fighter falls
 * back to a backup weapon, then fists, until a retrieve roll re-arms them.
 */
import { describe, it, expect } from 'vitest';
import {
  rollDisarmChance,
  isArmLocation,
  tryDisarm,
  tryRearm,
} from '@/engine/combat/resolution/disarm';
import { isDisarmable } from '@/engine/combat/mechanics/weaponStats';
import {
  DISARM_BASE_CHANCE,
  DISARM_PER_ARMHIT,
  DISARM_DAMAGE_COEFF,
  DISARM_CRIT_BONUS,
  DISARM_CHANCE_CAP,
  DISARM_UNARMED_WEAPON_ID,
  DISARM_ARM_LOCATIONS,
} from '@/constants/combat';
import { makeFighterState } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';

const armed = (over: Partial<FighterState> = {}): FighterState =>
  makeFighterState({ label: 'D', weaponId: 'broadsword', ...over });

describe('rollDisarmChance', () => {
  it('returns the base chance with no arm hits, no damage, no crit', () => {
    expect(rollDisarmChance({ armHits: 0, damageRatio: 0, isCrit: false })).toBeCloseTo(
      DISARM_BASE_CHANCE
    );
  });

  it('ramps with cumulative arm hits and damage ratio', () => {
    expect(rollDisarmChance({ armHits: 3, damageRatio: 0.2, isCrit: false })).toBeCloseTo(
      DISARM_BASE_CHANCE + 3 * DISARM_PER_ARMHIT + 0.2 * DISARM_DAMAGE_COEFF
    );
  });

  it('adds the crit bonus on critical arm hits', () => {
    const noCrit = rollDisarmChance({ armHits: 1, damageRatio: 0.1, isCrit: false });
    const crit = rollDisarmChance({ armHits: 1, damageRatio: 0.1, isCrit: true });
    expect(crit - noCrit).toBeCloseTo(DISARM_CRIT_BONUS);
  });

  it('caps at DISARM_CHANCE_CAP', () => {
    expect(rollDisarmChance({ armHits: 50, damageRatio: 1, isCrit: true })).toBe(
      DISARM_CHANCE_CAP
    );
  });
});

describe('isArmLocation', () => {
  it('matches every entry in DISARM_ARM_LOCATIONS', () => {
    for (const loc of DISARM_ARM_LOCATIONS) expect(isArmLocation(loc)).toBe(true);
  });
  it('rejects non-arm locations', () => {
    for (const loc of ['head', 'chest', 'abdomen', 'right leg', 'left leg']) {
      expect(isArmLocation(loc)).toBe(false);
    }
  });
});

describe('isDisarmable', () => {
  it('bare fists and no weapon are never disarmable', () => {
    expect(isDisarmable(undefined)).toBe(false);
    expect(isDisarmable('fist')).toBe(false);
  });
  it('normal weapons and weapon-slot shields are disarmable', () => {
    expect(isDisarmable('broadsword')).toBe(true);
    expect(isDisarmable('medium_shield')).toBe(true);
    expect(isDisarmable('maul')).toBe(true);
  });
  it('unknown ids are not disarmable', () => {
    expect(isDisarmable('not_a_weapon')).toBe(false);
  });
});

describe('tryDisarm', () => {
  it('drops the weapon to fists on a successful roll', () => {
    const defender = armed({ hp: 80, armHits: 2 });
    const events: CombatEvent[] = [];
    const fired = tryDisarm({
      events: events,
      rng: () => 0,
      defender: defender,
      defLabel: 'D',
      hitLoc: 'right arm',
      damage: 10,
      isCrit: false,
    });
    expect(fired).toBe(true);
    expect(defender.weaponId).toBe(DISARM_UNARMED_WEAPON_ID);
    expect(defender.droppedWeaponId).toBe('broadsword');
    expect(events.at(-1)).toMatchObject({
      type: 'DISARM',
      actor: 'D',
      metadata: { weaponId: 'broadsword', toWeapon: 'fist', backup: false },
    });
  });

  it('draws the backup weapon instead of going to fists', () => {
    const defender = armed({ hp: 80, backupWeaponId: 'dagger' });
    const events: CombatEvent[] = [];
    tryDisarm({
      events: events,
      rng: () => 0,
      defender: defender,
      defLabel: 'D',
      hitLoc: 'left arm',
      damage: 10,
      isCrit: false,
    });
    expect(defender.weaponId).toBe('dagger');
    expect(defender.backupWeaponId).toBeUndefined();
    expect(defender.droppedWeaponId).toBe('broadsword');
    expect(events.at(-1)?.metadata).toMatchObject({ toWeapon: 'dagger', backup: true });
  });

  it('a second disarm on the backup drops to fists and tracks the last drop', () => {
    const defender = armed({
      hp: 80,
      weaponId: 'dagger',
      droppedWeaponId: 'broadsword',
      backupWeaponId: undefined,
    });
    const events: CombatEvent[] = [];
    tryDisarm({
      events: events,
      rng: () => 0,
      defender: defender,
      defLabel: 'D',
      hitLoc: 'right arm',
      damage: 10,
      isCrit: false,
    });
    expect(defender.weaponId).toBe('fist');
    expect(defender.droppedWeaponId).toBe('dagger');
  });

  it('does not fire on non-arm locations', () => {
    const defender = armed({ hp: 80 });
    const events: CombatEvent[] = [];
    const fired = tryDisarm({
      events: events,
      rng: () => 0,
      defender: defender,
      defLabel: 'D',
      hitLoc: 'head',
      damage: 20,
      isCrit: true,
    });
    expect(fired).toBe(false);
    expect(defender.weaponId).toBe('broadsword');
    expect(events).toHaveLength(0);
  });

  it('does not fire on a dead/incapacitated defender', () => {
    const defender = armed({ hp: 0 });
    const events: CombatEvent[] = [];
    expect(
      tryDisarm({
        events: events,
        rng: () => 0,
        defender: defender,
        defLabel: 'D',
        hitLoc: 'right arm',
        damage: 50,
        isCrit: false,
      })
    ).toBe(false);
  });

  it('does not fire on an already-unarmed or weaponless defender', () => {
    const events: CombatEvent[] = [];
    expect(
      tryDisarm({
        events: events,
        rng: () => 0,
        defender: armed({ hp: 80, weaponId: 'fist' }),
        defLabel: 'D',
        hitLoc: 'right arm',
        damage: 10,
        isCrit: false,
      })
    ).toBe(false);
    expect(
      tryDisarm({
        events: events,
        rng: () => 0,
        defender: armed({ hp: 80, weaponId: undefined }),
        defLabel: 'D',
        hitLoc: 'right arm',
        damage: 10,
        isCrit: false,
      })
    ).toBe(false);
  });

  it('respects the probability roll — high rng never disarms', () => {
    const defender = armed({ hp: 80, armHits: 0 });
    const events: CombatEvent[] = [];
    expect(
      tryDisarm({
        events: events,
        rng: () => 0.99,
        defender: defender,
        defLabel: 'D',
        hitLoc: 'right arm',
        damage: 1,
        isCrit: false,
      })
    ).toBe(false);
    expect(defender.weaponId).toBe('broadsword');
  });
});

describe('tryRearm', () => {
  it('no-ops when nothing was dropped', () => {
    const fighter = armed();
    const events: CombatEvent[] = [];
    expect(tryRearm({ events: events, rng: () => 0, fighter: fighter, label: 'D' })).toBe(
      false
    );
    expect(events).toHaveLength(0);
  });

  it('keeps the fighter unarmed on a failed roll', () => {
    const fighter = armed({ weaponId: 'fist', droppedWeaponId: 'broadsword' });
    const events: CombatEvent[] = [];
    expect(tryRearm({ events: events, rng: () => 0.99, fighter: fighter, label: 'D' })).toBe(
      false
    );
    expect(fighter.weaponId).toBe('fist');
    expect(fighter.droppedWeaponId).toBe('broadsword');
  });

  it('restores the dropped weapon on a successful roll', () => {
    const fighter = armed({ weaponId: 'fist', droppedWeaponId: 'broadsword' });
    const events: CombatEvent[] = [];
    expect(tryRearm({ events: events, rng: () => 0, fighter: fighter, label: 'D' })).toBe(true);
    expect(fighter.weaponId).toBe('broadsword');
    expect(fighter.droppedWeaponId).toBeUndefined();
    expect(events.at(-1)).toMatchObject({
      type: 'REARM',
      actor: 'D',
      metadata: { weaponId: 'broadsword' },
    });
  });

  it('sheathes a drawn backup when the primary is retrieved', () => {
    const fighter = armed({ weaponId: 'dagger', droppedWeaponId: 'broadsword' });
    const events: CombatEvent[] = [];
    tryRearm({ events: events, rng: () => 0, fighter: fighter, label: 'D' });
    expect(fighter.weaponId).toBe('broadsword');
    expect(fighter.backupWeaponId).toBe('dagger');
  });
});

// ── Integration: exchange-start rearm and narration ────────────────────────
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { makeResolutionContext } from '@/test/_fixtures/factories';
import { narrateEvents } from '@/engine/combat/narrative/narrator';
import { makeNarrationContext } from '@/test/_fixtures/narrationContext';

describe('prepareExchange — rearm', () => {
  it('a disarmed fighter retrieves the dropped weapon at exchange start', () => {
    const fA = makeFighterState({ label: 'A', weaponId: 'broadsword' });
    const fD = makeFighterState({ label: 'D', weaponId: 'fist', droppedWeaponId: 'maul' });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ rng: () => 0 });
    prepareExchange(ctx, fA, fD, events);
    expect(fD.weaponId).toBe('maul');
    expect(fD.droppedWeaponId).toBeUndefined();
    expect(events.some((e) => e.type === 'REARM' && e.actor === 'D')).toBe(true);
  });

  it('failed retrieve rolls leave the fighter unarmed with no event', () => {
    const fA = makeFighterState({ label: 'A', weaponId: 'broadsword' });
    const fD = makeFighterState({ label: 'D', weaponId: 'fist', droppedWeaponId: 'maul' });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ rng: () => 0.99 });
    prepareExchange(ctx, fA, fD, events);
    expect(fD.weaponId).toBe('fist');
    expect(fD.droppedWeaponId).toBe('maul');
    expect(events.some((e) => e.type === 'REARM')).toBe(false);
  });
});

describe('narration — disarm/rearm', () => {
  it('DISARM and REARM events produce lines naming the fighter', () => {
    const ctx = makeNarrationContext();
    const { log } = narrateEvents(
      [
        {
          type: 'DISARM',
          actor: 'D',
          metadata: { weaponId: 'broadsword', toWeapon: 'fist', backup: false },
        },
        { type: 'REARM', actor: 'D', metadata: { weaponId: 'broadsword' } },
      ],
      ctx,
      1
    );
    expect(log.length).toBeGreaterThanOrEqual(2);
    for (const line of log) {
      expect(line.text).not.toContain('{{');
      expect(line.text).toContain('Lightning');
    }
  });

  it('a backup draw narrates a second beat', () => {
    const ctx = makeNarrationContext();
    const { log } = narrateEvents(
      [
        {
          type: 'DISARM',
          actor: 'A',
          metadata: { weaponId: 'broadsword', toWeapon: 'dagger', backup: true },
        },
      ],
      ctx,
      1
    );
    expect(log).toHaveLength(2);
    for (const line of log) expect(line.text).not.toContain('{{');
  });
});
