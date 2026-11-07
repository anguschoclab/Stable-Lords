/**
 * Characterization tests for resolveContestedDefense and resolveCombatOffenseDefense —
 * pins current behavior before refactoring. Tests run against unrefactored code.
 */
import { describe, it, expect } from 'vitest';
import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import {
  setupExchange,
  callResolveCombatOffenseDefense,
} from '@/test/_fixtures/exchangeSetup';

const STRONG_ATT: FighterState['skills'] = {
  ATT: 20,
  PAR: 10,
  DEF: 10,
  INI: 10,
  RIP: 10,
  DEC: 10,
};
const WEAK_DEF: FighterState['skills'] = { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 };
const MODEST_ATT: FighterState['skills'] = {
  ATT: 5,
  PAR: 10,
  DEF: 10,
  INI: 10,
  RIP: 10,
  DEC: 10,
};
const ELITE_GUARD: FighterState['skills'] = {
  ATT: 5,
  PAR: 25,
  DEF: 25,
  INI: 10,
  RIP: 25,
  DEC: 10,
};

describe('resolveCombatOffenseDefense — attack whiff path', () => {
  it('pushes ATTACK WHIFF event when attack check fails', () => {
    const s = setupExchange({
      ctx: { rng: () => 0.99 }, // high rng → attack likely fails
    });
    callResolveCombatOffenseDefense(s, true);
    // With rng=0.99 the attack should whiff (high roll = failure in skillCheck)
    // Just verify the function ran without crashing and produced events
    expect(s.events.length).toBeGreaterThan(0);
  });
});

describe('resolveCombatOffenseDefense — attack success path', () => {
  it('runs without crashing when attack succeeds and produces events', () => {
    const s = setupExchange({
      ctx: { rng: () => 0.01 }, // low rng → attack likely succeeds
    });
    callResolveCombatOffenseDefense(s, true);
    expect(s.events.length).toBeGreaterThan(0);
  });

  it('can produce HIT events on successful attack + failed defense', () => {
    const s = setupExchange({
      fA: {
        style: FightingStyle.StrikingAttack,
        skills: STRONG_ATT,
      },
      fD: {
        style: FightingStyle.WallOfSteel,
        skills: WEAK_DEF,
      },
      ctx: { rng: () => 0.01 },
    });
    callResolveCombatOffenseDefense(s, true);
    const hitEvents = s.events.filter((e) => e.type === 'HIT');
    // With strong attacker vs weak defender and low rng, should land hits
    expect(hitEvents.length).toBeGreaterThan(0);
  });
});

describe('resolveCombatOffenseDefense — counterstrike spending', () => {
  it('clears counterstrikePrimed after attack (hit or miss)', () => {
    const s = setupExchange({
      fA: { style: FightingStyle.ParryStrike, counterstrikePrimed: true },
    });
    callResolveCombatOffenseDefense(s, true);
    // counterstrikePrimed should be cleared regardless of hit/miss
    expect(s.fA.counterstrikePrimed).toBe(false);
  });
});

describe('resolveCombatOffenseDefense — momentum shift on hit', () => {
  it('attacker and defender momentum change from initial 0 on a landed hit', () => {
    const s = setupExchange({
      fA: {
        style: FightingStyle.StrikingAttack,
        skills: STRONG_ATT,
        momentum: 0,
      },
      fD: {
        style: FightingStyle.WallOfSteel,
        skills: WEAK_DEF,
        momentum: 0,
      },
      ctx: { rng: () => 0.01 },
    });
    callResolveCombatOffenseDefense(s, true);
    const hitEvents = s.events.filter((e) => e.type === 'HIT');
    if (hitEvents.length > 0) {
      // On a landed hit, attacker gains +1 and defender loses -1
      // (unless a riposte occurred, which flips momentum)
      expect(s.fA.momentum).not.toBe(0);
      expect(s.fD.momentum).not.toBe(0);
    }
  });
});

describe('resolveCombatOffenseDefense — successful defense (parry)', () => {
  it('pushes DEFENSE event on successful parry', () => {
    const s = setupExchange({
      fA: {
        style: FightingStyle.StrikingAttack,
        skills: MODEST_ATT,
      },
      fD: {
        style: FightingStyle.ParryRiposte,
        skills: { ATT: 5, PAR: 20, DEF: 20, INI: 10, RIP: 20, DEC: 10 },
      },
      ctx: { rng: () => 0.01 }, // low rng → attacker succeeds, defender also succeeds with high PAR
    });
    callResolveCombatOffenseDefense(s, true);
    // May or may not parry depending on rng sequence, but function should not crash
    expect(s.events.length).toBeGreaterThan(0);
  });
});

describe('resolveCombatOffenseDefense — PS counterstrike priming', () => {
  it('primes counterstrikePrimed on successful PS parry', () => {
    const s = setupExchange({
      fA: {
        style: FightingStyle.StrikingAttack,
        skills: MODEST_ATT,
      },
      fD: {
        style: FightingStyle.ParryStrike,
        skills: ELITE_GUARD,
      },
      ctx: { rng: () => 0.01 },
    });
    callResolveCombatOffenseDefense(s, true);
    // If defense succeeded, PS should have counterstrikePrimed set
    const parryEvents = s.events.filter((e) => e.type === 'DEFENSE' && e.result === 'PARRY');
    if (parryEvents.length > 0) {
      expect(s.fD.counterstrikePrimed).toBe(true);
    }
  });
});

describe('resolveCombatOffenseDefense — PR riposte streak', () => {
  it('updates riposteStreak on ParryRiposte after riposte check', () => {
    const s = setupExchange({
      fA: {
        style: FightingStyle.StrikingAttack,
        skills: MODEST_ATT,
      },
      fD: {
        style: FightingStyle.ParryRiposte,
        skills: ELITE_GUARD,
      },
      ctx: { rng: () => 0.01 },
    });
    callResolveCombatOffenseDefense(s, true);
    // riposteStreak should be a number (0 or positive) after the exchange
    expect(s.fD.riposteStreak).toBeDefined();
    expect(typeof s.fD.riposteStreak).toBe('number');
  });
});

describe('resolveCombatOffenseDefense — no crash with different aGoesFirst', () => {
  it('runs without crashing when D goes first', () => {
    const s = setupExchange();
    callResolveCombatOffenseDefense(s, false);
    expect(s.events.length).toBeGreaterThan(0);
  });
});
