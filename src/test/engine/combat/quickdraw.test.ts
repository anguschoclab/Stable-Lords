/**
 * V23 canon — "Effects of Coordination": clumsy fighters fumble the
 * quickdraw — the backup weapon doesn't come out cleanly after a disarm
 * and the fighter spends a beat recovering (draw retried next exchange).
 */
import { describe, it, expect } from 'vitest';
import { tryDisarm } from '@/engine/combat/resolution/disarm';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { QUICKDRAW_FUMBLE_CHANCE } from '@/constants/combat';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '@/engine/combat/resolution/types';

const armedClumsy = (over: Partial<FighterState> = {}): FighterState =>
  makeFighterState({
    label: 'D',
    weaponId: 'broadsword',
    backupWeaponId: 'dagger',
    armHits: 9,
    hp: 80,
    coordination: 'Clumsy',
    ...over,
  });

describe('fumbled backup draw — clumsy fighters (canon)', () => {
  it('a fumbled draw leaves the fighter on fists and emits FUMBLE', () => {
    const defender = armedClumsy();
    const events: CombatEvent[] = [];
    // rng stream: [disarm chance 0 → fires] then [fumble chance 0 → fumbles]
    const rng = () => 0;
    tryDisarm({
      events,
      rng,
      defender,
      defLabel: 'D',
      hitLoc: 'right arm',
      damage: 30,
      isCrit: true,
    });
    expect(defender.droppedWeaponId).toBe('broadsword');
    expect(defender.weaponId).toBe('fist');
    expect(defender.backupWeaponId).toBe('dagger'); // still sheathed — not consumed
    expect(events.some((e) => e.type === 'FUMBLE' && e.actor === 'D')).toBe(true);
  });

  it('a clean draw still equips the backup immediately', () => {
    const defender = armedClumsy();
    const events: CombatEvent[] = [];
    // rng: disarm fires (0), fumble check fails (0.99)
    let i = 0;
    const draws = [0, 0.99];
    const rng = () => draws[Math.min(i++, draws.length - 1)] ?? 0.5;
    tryDisarm({
      events,
      rng,
      defender,
      defLabel: 'D',
      hitLoc: 'right arm',
      damage: 30,
      isCrit: true,
    });
    expect(defender.weaponId).toBe('dagger');
    expect(defender.backupWeaponId).toBeUndefined();
    expect(events.some((e) => e.type === 'FUMBLE')).toBe(false);
  });

  it('non-clumsy fighters never fumble the draw', () => {
    const defender = armedClumsy({ coordination: 'Very Highly Coordinated' });
    const events: CombatEvent[] = [];
    tryDisarm({
      events,
      rng: () => 0,
      defender,
      defLabel: 'D',
      hitLoc: 'right arm',
      damage: 30,
      isCrit: true,
    });
    expect(defender.weaponId).toBe('dagger');
    expect(events.some((e) => e.type === 'FUMBLE')).toBe(false);
  });

  it('the fumbled backup is retried at exchange start', () => {
    const fA = makeFighterState({ label: 'A', weaponId: 'broadsword' });
    const fD = armedClumsy({
      weaponId: 'fist',
      droppedWeaponId: 'broadsword',
      backupWeaponId: 'dagger',
      pendingBackupDraw: true,
    });
    const events: CombatEvent[] = [];
    // disarm stream: retrieve roll fails (0.99) but the pending backup
    // draw completes (0) — ordering pinned by implementation.
    const ctx = makeResolutionContext({ disarmRng: () => 0 });
    prepareExchange(ctx, fA, fD, events);
    expect(fD.weaponId).toBe('dagger');
    expect(fD.backupWeaponId).toBeUndefined();
  });

  it('fumble chance is coordination-gated by table, not hardcoded', () => {
    expect(QUICKDRAW_FUMBLE_CHANCE['Clumsy']).toBeGreaterThan(0);
    expect(QUICKDRAW_FUMBLE_CHANCE['Clumsy']).toBeLessThan(1);
  });
});
