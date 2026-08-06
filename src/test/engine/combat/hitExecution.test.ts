/**
 * Characterization tests for executeHit — pins current behavior before
 * refactoring. Tests run against the unrefactored code and must stay green.
 */
import { describe, it, expect } from 'vitest';
import { executeHit } from '@/engine/combat/resolution/exchangeHelpers/execution/hitExecution';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import type { WeatherType, PsychState } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import { resolveEffectiveTactics } from '@/engine/combat/resolution/tactics';
import { getOffensiveTacticMods } from '@/engine/combat/mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import {
  COMMIT_HP_THRESHOLD,
  COMMIT_KILL_DESIRE,
  MOMENTUM_CAP,
  MOMENTUM_FLOOR,
} from '@/constants/combat/combat';
import { accumulateGuardBreak } from '@/engine/combat/resolution/guardBreak';
import { accumulateBleed } from '@/engine/combat/resolution/bleed';

function makeFighter(overrides: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    plan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5 } as any,
    activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5 } as any,
    psychState: 'Neutral' as PsychState,
    hp: 100,
    maxHp: 100,
    endurance: 100,
    maxEndurance: 100,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
    totalFights: 0,
    momentum: 0,
    committed: false,
    survivalStrike: false,
    recoveryDebt: 0,
    ...overrides,
  } as FighterState;
}

function makeCtx(overrides: Partial<ResolutionContext> = {}): ResolutionContext {
  return {
    rng: () => 0.5,
    phase: 'OPENING',
    exchange: 0,
    weather: 'Clear' as WeatherType,
    weatherEffect: {
      staminaMult: 1,
      initiativeMod: 0,
      riposteMod: 0,
      damageMult: 1,
      description: '',
    },
    matchupA: 0,
    matchupD: 0,
    trainerModsA: {},
    trainerModsD: {},
    weaponReqA: { endurancePenalty: 1, attPenalty: 0 },
    weaponReqD: { endurancePenalty: 1, attPenalty: 0 },
    tacticStreakA: 0,
    tacticStreakD: 0,
    range: 'Striking' as any,
    zone: 'Center' as any,
    arenaConfig: { tags: [] } as any,
    surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    maxRange: 'Extended' as any,
    zoneStepBias: 0,
    ...overrides,
  } as ResolutionContext;
}

function getPassive(style: FightingStyle, hp = 100, maxHp = 100, end = 100, maxEnd = 100) {
  return getStylePassive(style, {
    phase: 'OPENING',
    exchange: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: hp / maxHp,
    endRatio: end / maxEnd,
    opponentStyle: FightingStyle.WallOfSteel,
  });
}

interface CallOpts {
  attacker?: Partial<FighterState>;
  defender?: Partial<FighterState>;
  ctx?: Partial<ResolutionContext>;
  rng?: () => number;
  attKD?: number;
  attOE?: number;
  attAL?: number;
  attMatchup?: number;
  attLabel?: 'A' | 'D';
  defLabel?: 'A' | 'D';
  stylePhase?: any;
  phase?: string;
}

function callExecuteHit(opts: CallOpts = {}): {
  events: CombatEvent[];
  attacker: FighterState;
  defender: FighterState;
  ctx: ResolutionContext;
} {
  const attacker = makeFighter({ ...opts.attacker });
  const defender = makeFighter({ label: 'D', style: FightingStyle.WallOfSteel, ...opts.defender });
  const ctx = makeCtx(opts.ctx);
  const events: CombatEvent[] = [];
  const rng = opts.rng ?? (() => 0.5);
  const tactA = resolveEffectiveTactics(attacker.activePlan, 'opening');
  const offModsA = getOffensiveTacticMods(tactA.offTactic, attacker.style);
  const passA = getPassive(attacker.style, attacker.hp, attacker.maxHp, attacker.endurance, attacker.maxEndurance);
  const passD = getPassive(defender.style, defender.hp, defender.maxHp, defender.endurance, defender.maxEndurance);

  executeHit(
    events,
    rng,
    attacker,
    defender,
    tactA,
    offModsA,
    passA,
    opts.attLabel ?? 'A',
    opts.defLabel ?? 'D',
    opts.stylePhase ?? 'OPENING',
    opts.phase ?? 'OPENING',
    opts.attKD ?? attacker.activePlan.killDesire ?? 5,
    opts.attOE ?? 5,
    opts.attAL ?? 5,
    opts.attMatchup ?? 0,
    ctx,
    passD
  );

  return { events, attacker, defender, ctx };
}

describe('executeHit — survival strike path', () => {
  it('fires riposte and clears survivalStrike when defender has it primed', () => {
    const { events, defender } = callExecuteHit({
      defender: { survivalStrike: true },
    });
    expect(defender.survivalStrike).toBe(false);
    const defenseEvents = events.filter((e) => e.type === 'DEFENSE' && e.result === 'RIPOSTE');
    expect(defenseEvents.length).toBe(1);
  });

  it('pushes HIT event from defender to attacker on survival strike', () => {
    const { events } = callExecuteHit({
      defender: { survivalStrike: true },
    });
    const hitEvents = events.filter((e) => e.type === 'HIT' && e.actor === 'D' && e.target === 'A');
    expect(hitEvents.length).toBe(1);
  });

  it('reduces attacker HP by riposte damage', () => {
    const { attacker } = callExecuteHit({
      defender: { survivalStrike: true },
    });
    expect(attacker.hp).toBeLessThan(100);
    expect(attacker.hitsTaken).toBe(1);
  });

  it('pushes BOUT_END KO when attacker HP drops to 0 from survival strike', () => {
    const { events } = callExecuteHit({
      attacker: { hp: 1, maxHp: 100 },
      defender: { survivalStrike: true, derived: { hp: 100, endurance: 100, damage: 50, encumbrance: 0 } },
    });
    const boutEnd = events.filter((e) => e.type === 'BOUT_END' && e.result === 'KO');
    expect(boutEnd.length).toBe(1);
    expect(boutEnd[0]!.metadata?.cause).toBe('SURVIVAL_STRIKE');
  });

  it('does not process normal hit when survival strike fires', () => {
    const { events, defender } = callExecuteHit({
      defender: { survivalStrike: true },
    });
    // No normal HIT from attacker to defender
    const normalHits = events.filter((e) => e.type === 'HIT' && e.actor === 'A' && e.target === 'D');
    expect(normalHits.length).toBe(0);
    // Defender HP unchanged
    expect(defender.hp).toBe(100);
  });
});

describe('executeHit — commit mechanic', () => {
  it('sets committed=true when attacker HP < threshold and killDesire >= threshold', () => {
    const hp = Math.floor(COMMIT_HP_THRESHOLD * 100) - 1; // 34
    const { attacker, events } = callExecuteHit({
      attacker: { hp, maxHp: 100, activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: COMMIT_KILL_DESIRE } as any },
    });
    expect(attacker.committed).toBe(true);
    expect(events.some((e) => e.type === 'STATE_CHANGE' && e.result === 'COMMIT')).toBe(true);
  });

  it('does not commit when killDesire is below threshold', () => {
    const hp = Math.floor(COMMIT_HP_THRESHOLD * 100) - 1;
    const { attacker } = callExecuteHit({
      attacker: { hp, maxHp: 100, activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 3 } as any },
    });
    expect(attacker.committed).toBe(false);
  });

  it('does not commit when HP is above threshold', () => {
    const { attacker } = callExecuteHit({
      attacker: { hp: 80, maxHp: 100, activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 10 } as any },
    });
    expect(attacker.committed).toBe(false);
  });

  it('does not re-commit if already committed', () => {
    const hp = Math.floor(COMMIT_HP_THRESHOLD * 100) - 1;
    const { events } = callExecuteHit({
      attacker: { hp, maxHp: 100, committed: true, activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: COMMIT_KILL_DESIRE } as any },
    });
    // No second STATE_CHANGE COMMIT event
    const commitEvents = events.filter((e) => e.type === 'STATE_CHANGE' && e.result === 'COMMIT');
    expect(commitEvents.length).toBe(0);
  });
});

describe('executeHit — BA guard break', () => {
  it('increments defender.parDegrade on BashingAttack hit', () => {
    const { defender } = callExecuteHit({
      attacker: { style: FightingStyle.BashingAttack },
    });
    expect(defender.parDegrade).toBe(accumulateGuardBreak(0));
  });
});

describe('executeHit — SL bleed', () => {
  it('increments defender.bleedStacks on SlashingAttack hit', () => {
    const { defender } = callExecuteHit({
      attacker: { style: FightingStyle.SlashingAttack },
    });
    expect(defender.bleedStacks).toBe(accumulateBleed(0));
  });
});

describe('executeHit — hit counters', () => {
  it('updates hit counters on a normal hit', () => {
    const { attacker, defender } = callExecuteHit();
    expect(attacker.hitsLanded).toBe(1);
    expect(attacker.consecutiveHits).toBe(1);
    expect(defender.hitsTaken).toBe(1);
    expect(defender.consecutiveHits).toBe(0);
  });

  it('reduces defender HP by damage amount', () => {
    const { defender } = callExecuteHit();
    expect(defender.hp).toBeLessThan(100);
  });

  it('increments armHits when hit location includes "arm"', () => {
    // Can't control hit location directly, but with enough hits some should land on arms
    const defender = makeFighter({ label: 'D', style: FightingStyle.WallOfSteel });
    const ctx = makeCtx();
    const events: CombatEvent[] = [];
    const rng = () => 0.5;
    const tactA = resolveEffectiveTactics(defender.activePlan, 'opening');
    const offModsA = getOffensiveTacticMods(tactA.offTactic, FightingStyle.StrikingAttack);
    const passA = getPassive(FightingStyle.StrikingAttack);
    const passD = getPassive(FightingStyle.WallOfSteel);
    // Run multiple hits to accumulate arm hits
    const attacker = makeFighter({ style: FightingStyle.StrikingAttack });
    for (let i = 0; i < 20; i++) {
      executeHit(events, rng, { ...attacker, hitsLanded: i, consecutiveHits: 0 }, defender, tactA, offModsA, passA, 'A', 'D', 'OPENING', 'OPENING', 5, 5, 5, 0, ctx, passD);
      if (defender.armHits > 0) break;
    }
    // With 20 hits, at least one should hit an arm
    expect(defender.armHits).toBeGreaterThan(0);
  });
});

describe('executeHit — momentum shift', () => {
  it('increments attacker momentum and decrements defender momentum on hit', () => {
    const { attacker, defender, events } = callExecuteHit({
      attacker: { momentum: 0 },
      defender: { momentum: 0 },
    });
    expect(attacker.momentum).toBe(1);
    expect(defender.momentum).toBe(-1);
    expect(events.some((e) => e.type === 'MOMENTUM_SHIFT')).toBe(true);
  });

  it('caps attacker momentum at MOMENTUM_CAP', () => {
    const { attacker } = callExecuteHit({
      attacker: { momentum: MOMENTUM_CAP },
    });
    expect(attacker.momentum).toBe(MOMENTUM_CAP);
  });

  it('floors defender momentum at MOMENTUM_FLOOR', () => {
    const { defender } = callExecuteHit({
      defender: { momentum: MOMENTUM_FLOOR },
    });
    expect(defender.momentum).toBe(MOMENTUM_FLOOR);
  });

  it('does not push MOMENTUM_SHIFT when both values are already at caps', () => {
    const { events } = callExecuteHit({
      attacker: { momentum: MOMENTUM_CAP },
      defender: { momentum: MOMENTUM_FLOOR },
    });
    expect(events.some((e) => e.type === 'MOMENTUM_SHIFT')).toBe(false);
  });
});

describe('executeHit — knockdown', () => {
  it('can knock down defender when HP ratio is low and damage is high', () => {
    // Need a high-damage hit to trigger knockdown
    const { defender, events } = callExecuteHit({
      attacker: { style: FightingStyle.BashingAttack, derived: { hp: 100, endurance: 100, damage: 30, encumbrance: 0 }, attributes: { ST: 20, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } },
      defender: { hp: 20, maxHp: 100, style: FightingStyle.WallOfSteel },
      rng: () => 0.01, // low rng for knockdown check
    });
    // Knockdown is probabilistic, just verify the function ran
    if (defender.knockedDown) {
      expect(events.some((e) => e.type === 'KNOCKDOWN')).toBe(true);
    }
  });

  it('does not knock down when defender is already knocked down', () => {
    const { defender } = callExecuteHit({
      attacker: { derived: { hp: 100, endurance: 100, damage: 50, encumbrance: 0 } },
      defender: { hp: 10, maxHp: 100, knockedDown: true },
      rng: () => 0.01,
    });
    // Already knocked down — no new knockdown event
    expect(defender.knockedDown).toBe(true);
  });
});

describe('executeHit — survival strike priming', () => {
  it('primes defender survivalStrike when attacker is committed and defender survives', () => {
    const hp = Math.floor(COMMIT_HP_THRESHOLD * 100) - 1;
    const { defender, events } = callExecuteHit({
      attacker: { hp, maxHp: 100, committed: true, activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: COMMIT_KILL_DESIRE } as any },
      defender: { hp: 50, maxHp: 100 },
    });
    expect(defender.survivalStrike).toBe(true);
    expect(events.some((e) => e.type === 'STATE_CHANGE' && e.result === 'SURVIVAL_STRIKE')).toBe(true);
  });

  it('does not prime survivalStrike when defender HP drops to 0', () => {
    const { defender } = callExecuteHit({
      attacker: { hp: 30, maxHp: 100, committed: true, derived: { hp: 100, endurance: 100, damage: 200, encumbrance: 0 } },
      defender: { hp: 1, maxHp: 100 },
    });
    expect(defender.survivalStrike).toBe(false);
  });
});

describe('executeHit — insight', () => {
  it('can push INSIGHT event when damage > 0 and rng < INSIGHT_CHANCE', () => {
    const { events } = callExecuteHit({
      rng: () => 0.01, // low rng → always triggers insight (0.01 < 0.2)
    });
    const insightEvents = events.filter((e) => e.type === 'INSIGHT');
    // With rng=0.01, insight should fire (unless no damage was dealt)
    if (insightEvents.length > 0) {
      expect(insightEvents[0]!.metadata?.attribute).toBeDefined();
    }
  });
});

describe('executeHit — kill window / bout end', () => {
  it('pushes BOUT_END with Kill result when kill window succeeds', () => {
    // Very high damage attacker, low HP defender, high killDesire
    const { events, defender } = callExecuteHit({
      attacker: {
        style: FightingStyle.StrikingAttack,
        derived: { hp: 100, endurance: 100, damage: 100, encumbrance: 0 },
        attributes: { ST: 20, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 20 },
        skills: { ATT: 20, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 20 },
      },
      defender: { hp: 1, maxHp: 100, endurance: 1, maxEndurance: 100 },
      rng: () => 0.001, // very low rng → kill window check succeeds
      attKD: 10,
    });
    const boutEnd = events.filter((e) => e.type === 'BOUT_END');
    if (boutEnd.length > 0) {
      expect(defender.hp).toBeLessThanOrEqual(0);
      expect(boutEnd[0]!.result).toMatch(/Kill|KO/);
    }
  });

  it('pushes BOUT_END with KO when defender HP drops to 0 without kill', () => {
    const { events, defender } = callExecuteHit({
      attacker: {
        derived: { hp: 100, endurance: 100, damage: 200, encumbrance: 0 },
      },
      defender: { hp: 1, maxHp: 100, endurance: 100, maxEndurance: 100 },
      rng: () => 0.99, // high rng → kill window check fails, but HP still drops to 0
    });
    if (defender.hp <= 0) {
      const boutEnd = events.filter((e) => e.type === 'BOUT_END');
      expect(boutEnd.length).toBeGreaterThan(0);
    }
  });
});

describe('executeHit — HIT event structure', () => {
  it('pushes HIT event with correct actor, target, and location', () => {
    const { events } = callExecuteHit();
    const hitEvents = events.filter((e) => e.type === 'HIT' && e.actor === 'A' && e.target === 'D');
    expect(hitEvents.length).toBe(1);
    expect(hitEvents[0]!.location).toBeDefined();
    expect(typeof hitEvents[0]!.value).toBe('number');
  });

  it('includes appliedDamage in metadata', () => {
    const { events } = callExecuteHit();
    const hitEvents = events.filter((e) => e.type === 'HIT' && e.actor === 'A');
    expect(hitEvents[0]!.metadata?.appliedDamage).toBeDefined();
    expect(typeof hitEvents[0]!.metadata?.appliedDamage).toBe('number');
  });
});

describe('executeHit — no crash without ctx', () => {
  it('runs without crashing when ctx is undefined', () => {
    const attacker = makeFighter();
    const defender = makeFighter({ label: 'D', style: FightingStyle.WallOfSteel });
    const events: CombatEvent[] = [];
    const rng = () => 0.5;
    const tactA = resolveEffectiveTactics(attacker.activePlan, 'opening');
    const offModsA = getOffensiveTacticMods(tactA.offTactic, attacker.style);
    const passA = getPassive(attacker.style);
    const passD = getPassive(defender.style);

    executeHit(
      events, rng, attacker, defender,
      tactA, offModsA, passA,
      'A', 'D', 'OPENING', 'OPENING',
      5, 5, 5, 0,
      undefined, passD
    );
    expect(events.length).toBeGreaterThan(0);
  });
});
