import { describe, it, expect } from 'vitest';
import { applyEnduranceCosts } from '@/engine/combat/resolution/exchangeHelpers/mechanics/enduranceCosts';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import type { WeatherType, PsychState } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import { enduranceCost } from '@/engine/combat/mechanics/combatFatigue';
import { getEnduranceMult } from '@/engine/stylePassives';
import { DEFENDER_ENDURANCE_DISCOUNT } from '@/constants/combat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFighter(overrides: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: FightingStyle.ParryLunge,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    plan: { style: FightingStyle.ParryLunge, OE: 5, AL: 5 } as any,
    activePlan: { style: FightingStyle.ParryLunge, OE: 5, AL: 5 } as any,
    psychState: 'Neutral',
    hp: 100,
    maxHp: 100,
    endurance: 1000,
    maxEndurance: 1000,
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
    weatherEffect: { staminaMult: 1, initiativeMod: 0, riposteMod: 0, damageMult: 1, description: '' },
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
    arenaConfig: {} as any,
    surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    maxRange: 'Extended' as any,
    zoneStepBias: 0,
    ...overrides,
  } as ResolutionContext;
}

interface DrainOpts {
  oe: number;
  al: number;
  style: FightingStyle;
  weather: WeatherType;
  weaponPenalty: number;
  encumbranceMult: number;
  arenaEndMult: number;
  psychMult: number;
  traitMult: number;
}

function expectedAttDrain(o: DrainOpts): number {
  return Math.round(
    enduranceCost(o.oe, o.al, o.weather) *
      getEnduranceMult(o.style) *
      o.weaponPenalty *
      o.encumbranceMult *
      o.arenaEndMult *
      o.psychMult *
      o.traitMult
  );
}

function expectedDefDrain(o: DrainOpts): number {
  return Math.max(
    1,
    Math.round(
      enduranceCost(o.oe, o.al, o.weather) *
        DEFENDER_ENDURANCE_DISCOUNT *
        getEnduranceMult(o.style) *
        o.weaponPenalty *
        o.encumbranceMult *
        o.arenaEndMult *
        o.psychMult *
        o.traitMult
    )
  );
}

interface RunOpts {
  arenaEndMult?: number;
  weather?: WeatherType;
  fAStyle?: FightingStyle;
  fDStyle?: FightingStyle;
  fAPsych?: PsychState;
  fDPsych?: PsychState;
  fATrait?: number;
  fDTrait?: number;
  fAEncumbrance?: number;
  fDEncumbrance?: number;
  fAWeaponPenalty?: number;
  fDWeaponPenalty?: number;
  oeA?: number;
  alA?: number;
  oeD?: number;
  alD?: number;
  aGoesFirst?: boolean;
  enduranceA?: number;
  enduranceD?: number;
  hpA?: number;
  hpD?: number;
  preEvents?: CombatEvent[];
}

function run(opts: RunOpts): { fA: FighterState; fD: FighterState; events: CombatEvent[] } {
  const aGoesFirst = opts.aGoesFirst ?? true;
  const oeA = opts.oeA ?? 10;
  const alA = opts.alA ?? 10;
  const oeD = opts.oeD ?? 10;
  const alD = opts.alD ?? 10;

  const ctx = makeCtx({
    weather: (opts.weather ?? 'Clear') as WeatherType,
    surfaceMod: { initiativeMod: 0, enduranceMult: opts.arenaEndMult ?? 1.0, riposteMod: 0 },
    weaponReqA: { endurancePenalty: opts.fAWeaponPenalty ?? 1, attPenalty: 0 },
    weaponReqD: { endurancePenalty: opts.fDWeaponPenalty ?? 1, attPenalty: 0 },
  });

  const fA = makeFighter({
    label: 'A',
    style: opts.fAStyle ?? FightingStyle.ParryLunge,
    psychState: opts.fAPsych ?? 'Neutral',
    endurance: opts.enduranceA ?? 1000,
    hp: opts.hpA ?? 100,
    staticEnduranceMult: opts.fATrait,
    encumbrancePenalty: opts.fAEncumbrance
      ? { iniPenalty: 0, enduranceMult: opts.fAEncumbrance }
      : undefined,
  });
  const fD = makeFighter({
    label: 'D',
    style: opts.fDStyle ?? FightingStyle.ParryLunge,
    psychState: opts.fDPsych ?? 'Neutral',
    endurance: opts.enduranceD ?? 1000,
    hp: opts.hpD ?? 100,
    staticEnduranceMult: opts.fDTrait,
    encumbrancePenalty: opts.fDEncumbrance
      ? { iniPenalty: 0, enduranceMult: opts.fDEncumbrance }
      : undefined,
  });

  const events: CombatEvent[] = [...(opts.preEvents ?? [])];

  const curAttOE = aGoesFirst ? oeA : oeD;
  const curAttAL = aGoesFirst ? alA : alD;
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;

  applyEnduranceCosts(
    events,
    ctx,
    fA,
    fD,
    aGoesFirst,
    curAttOE,
    curAttAL,
    curAttWepReq,
    curDefWepReq,
    oeD,
    alD,
    oeA,
    alA
  );

  return { fA, fD, events };
}

const BASE = {
  oe: 10,
  al: 10,
  style: FightingStyle.ParryLunge,
  weather: 'Clear' as WeatherType,
  weaponPenalty: 10,
  encumbranceMult: 1,
  arenaEndMult: 1.0,
  psychMult: 1.0,
  traitMult: 1,
};

// ─── surfaceMod.enduranceMult ─────────────────────────────────────────────────

describe('applyEnduranceCosts — surfaceMod.enduranceMult', () => {
  it('baseline (1.0): att & def drain match unmodified formula', () => {
    const { fA, fD } = run({ fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attExp = expectedAttDrain({ ...BASE });
    const defExp = expectedDefDrain({ ...BASE });
    expect(1000 - fA.endurance).toBe(attExp);
    expect(1000 - fD.endurance).toBe(defExp);
  });

  it('high-drain (1.25, Flooded Vault): att & def drain > baseline', () => {
    const base = run({ fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const high = run({ arenaEndMult: 1.25, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attExp = expectedAttDrain({ ...BASE, arenaEndMult: 1.25 });
    const defExp = expectedDefDrain({ ...BASE, arenaEndMult: 1.25 });
    expect(1000 - high.fA.endurance).toBe(attExp);
    expect(1000 - high.fD.endurance).toBe(defExp);
    expect(1000 - high.fA.endurance).toBeGreaterThan(1000 - base.fA.endurance);
    expect(1000 - high.fD.endurance).toBeGreaterThan(1000 - base.fD.endurance);
  });

  it('low-drain (0.95, Crystal Cavern): att & def drain < baseline', () => {
    const base = run({ fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const low = run({ arenaEndMult: 0.95, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attExp = expectedAttDrain({ ...BASE, arenaEndMult: 0.95 });
    const defExp = expectedDefDrain({ ...BASE, arenaEndMult: 0.95 });
    expect(1000 - low.fA.endurance).toBe(attExp);
    expect(1000 - low.fD.endurance).toBe(defExp);
    expect(1000 - low.fA.endurance).toBeLessThan(1000 - base.fA.endurance);
    expect(1000 - low.fD.endurance).toBeLessThan(1000 - base.fD.endurance);
  });

  it('enduranceMult 1.15 (Mudpit): exact rounded values', () => {
    const { fA, fD } = run({ arenaEndMult: 1.15, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    expect(1000 - fA.endurance).toBe(expectedAttDrain({ ...BASE, arenaEndMult: 1.15 }));
    expect(1000 - fD.endurance).toBe(expectedDefDrain({ ...BASE, arenaEndMult: 1.15 }));
  });

  it('enduranceMult 1.05 (Underpit): exact rounded values', () => {
    const { fA, fD } = run({ arenaEndMult: 1.05, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    expect(1000 - fA.endurance).toBe(expectedAttDrain({ ...BASE, arenaEndMult: 1.05 }));
    expect(1000 - fD.endurance).toBe(expectedDefDrain({ ...BASE, arenaEndMult: 1.05 }));
  });

  it('enduranceMult 1.2 (Sunken Temple): exact rounded values', () => {
    const { fA, fD } = run({ arenaEndMult: 1.2, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    expect(1000 - fA.endurance).toBe(expectedAttDrain({ ...BASE, arenaEndMult: 1.2 }));
    expect(1000 - fD.endurance).toBe(expectedDefDrain({ ...BASE, arenaEndMult: 1.2 }));
  });
});

// ─── Full multiplicative chain ────────────────────────────────────────────────

describe('applyEnduranceCosts — full multiplicative chain', () => {
  it('style enduranceMult applies: TP (0.9) drains less than PR (1.04)', () => {
    const tp = run({ fAStyle: FightingStyle.TotalParry, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const pr = run({ fAStyle: FightingStyle.ParryRiposte, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const tpDrain = 1000 - tp.fA.endurance;
    const prDrain = 1000 - pr.fA.endurance;
    expect(tpDrain).toBe(expectedAttDrain({ ...BASE, style: FightingStyle.TotalParry }));
    expect(prDrain).toBe(expectedAttDrain({ ...BASE, style: FightingStyle.ParryRiposte }));
    expect(tpDrain).toBeLessThan(prDrain);
  });

  it('weapon endurancePenalty applies: 1.5× increases att drain by 50%', () => {
    const r = run({ fAWeaponPenalty: 1.5 });
    const attExp = expectedAttDrain({ ...BASE, weaponPenalty: 1.5 });
    expect(1000 - r.fA.endurance).toBe(attExp);
    expect(attExp).toBeGreaterThan(expectedAttDrain({ ...BASE, weaponPenalty: 1 }));
  });

  it('encumbrance penalty applies: 1.3× increases att drain by 30%', () => {
    const r = run({ fAEncumbrance: 1.3, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attExp = expectedAttDrain({ ...BASE, encumbranceMult: 1.3 });
    expect(1000 - r.fA.endurance).toBe(attExp);
    expect(attExp).toBeGreaterThan(expectedAttDrain({ ...BASE }));
  });

  it('psych state enduranceCostMult applies: Cruising (0.9) and FatiguePanic (1.1)', () => {
    const cruis = run({ fAPsych: 'Cruising', fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const panic = run({ fAPsych: 'FatiguePanic', fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const neutral = run({ fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const cruisDrain = 1000 - cruis.fA.endurance;
    const panicDrain = 1000 - panic.fA.endurance;
    const neutralDrain = 1000 - neutral.fA.endurance;
    expect(cruisDrain).toBe(expectedAttDrain({ ...BASE, psychMult: 0.9 }));
    expect(panicDrain).toBe(expectedAttDrain({ ...BASE, psychMult: 1.1 }));
    expect(cruisDrain).toBeLessThan(neutralDrain);
    expect(panicDrain).toBeGreaterThan(neutralDrain);
  });

  it('staticEnduranceMult (trait) applies: 0.8 decreases att drain by 20%', () => {
    const r = run({ fATrait: 0.8, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attExp = expectedAttDrain({ ...BASE, traitMult: 0.8 });
    expect(1000 - r.fA.endurance).toBe(attExp);
    expect(attExp).toBeLessThan(expectedAttDrain({ ...BASE }));
  });

  it('defender discount (0.6) applies: def drain ≈ att drain × 0.6', () => {
    const { fA, fD } = run({ fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    const attDrain = 1000 - fA.endurance;
    const defDrain = 1000 - fD.endurance;
    const attExp = expectedAttDrain({ ...BASE });
    const defExp = expectedDefDrain({ ...BASE });
    expect(attDrain).toBe(attExp);
    expect(defDrain).toBe(defExp);
    expect(defExp).toBe(Math.max(1, Math.round(attExp * DEFENDER_ENDURANCE_DISCOUNT)));
  });

  it('all multipliers stack multiplicatively', () => {
    const r = run({
      fAStyle: FightingStyle.TotalParry,
      fAWeaponPenalty: 1.5,
      fAEncumbrance: 1.3,
      arenaEndMult: 1.25,
      fAPsych: 'FatiguePanic',
      fATrait: 0.8,
    });
    const attExp = expectedAttDrain({
      oe: 10,
      al: 10,
      style: FightingStyle.TotalParry,
      weather: 'Clear',
      weaponPenalty: 1.5,
      encumbranceMult: 1.3,
      arenaEndMult: 1.25,
      psychMult: 1.1,
      traitMult: 0.8,
    });
    expect(1000 - r.fA.endurance).toBe(attExp);
  });
});

// ─── Defender floor ───────────────────────────────────────────────────────────

describe('applyEnduranceCosts — defender floor', () => {
  it('defender drain clamped to ≥1 even when base cost is 0', () => {
    const { fD } = run({ oeA: 0, alA: 0, oeD: 0, alD: 0 });
    expect(1000 - fD.endurance).toBe(1); // Math.max(1, Math.round(0)) = 1
  });

  it('attacker drain can be 0 (no floor on attacker)', () => {
    const { fA } = run({ oeA: 0, alA: 0, oeD: 0, alD: 0 });
    expect(1000 - fA.endurance).toBe(0); // Math.round(0) = 0, no floor
  });
});

// ─── Role reversal (aGoesFirst: false) ────────────────────────────────────────

describe('applyEnduranceCosts — role reversal (aGoesFirst: false)', () => {
  it('aGoesFirst=false: fD is attacker, fA is defender', () => {
    const { fA, fD } = run({
      aGoesFirst: false,
      oeA: 10,
      alA: 10,
      oeD: 5,
      alD: 5,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    // fD is attacker → uses oeD/alD = 5/5
    const attExp = expectedAttDrain({ ...BASE, oe: 5, al: 5 });
    // fA is defender → uses oeA/alA = 10/10
    const defExp = expectedDefDrain({ ...BASE, oe: 10, al: 10 });
    expect(1000 - fD.endurance).toBe(attExp);
    expect(1000 - fA.endurance).toBe(defExp);
  });

  it('psych mult maps to correct fighter when reversed', () => {
    const { fA, fD } = run({
      aGoesFirst: false,
      fAPsych: 'Neutral',
      fDPsych: 'Cruising',
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    // fD is attacker with Cruising (0.9)
    const attExp = expectedAttDrain({ ...BASE, psychMult: 0.9 });
    // fA is defender with Neutral (1.0)
    const defExp = expectedDefDrain({ ...BASE, psychMult: 1.0 });
    expect(1000 - fD.endurance).toBe(attExp);
    expect(1000 - fA.endurance).toBe(defExp);
  });
});

// ─── Exhaustion / BOUT_END events ─────────────────────────────────────────────

describe('applyEnduranceCosts — exhaustion / BOUT_END events', () => {
  it('both fighters exhausted → Exhaustion event', () => {
    const { events } = run({
      enduranceA: 1,
      enduranceD: 1,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    expect(boutEnd).toBeDefined();
    expect(boutEnd!.result).toBe('Exhaustion');
    expect(boutEnd!.metadata).toEqual({ cause: 'FATIGUE_COLLAPSE' });
  });

  it('one fighter exhausted → Stoppage event', () => {
    const { events } = run({
      enduranceA: 1,
      enduranceD: 1000,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    expect(boutEnd).toBeDefined();
    expect(boutEnd!.result).toBe('Stoppage');
    expect(boutEnd!.actor).toBe('A');
  });

  it('FATIGUE_COLLAPSE metadata when HP < 15%', () => {
    const { events } = run({
      enduranceA: 1,
      enduranceD: 1000,
      hpA: 5,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    expect(boutEnd).toBeDefined();
    expect(boutEnd!.metadata).toEqual({ cause: 'FATIGUE_COLLAPSE' });
  });

  it('no FATIGUE_COLLAPSE metadata when HP ≥ 15%', () => {
    const { events } = run({
      enduranceA: 1,
      enduranceD: 1000,
      hpA: 50,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    expect(boutEnd).toBeDefined();
    expect(boutEnd!.metadata).toBeUndefined();
  });

  it('no BOUT_END when Kill already in events', () => {
    const preEvents: CombatEvent[] = [
      { type: 'BOUT_END', actor: 'A', result: 'Kill' },
    ];
    const { events } = run({
      enduranceA: 1,
      enduranceD: 1,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
      preEvents,
    });
    const boutEnds = events.filter((e) => e.type === 'BOUT_END');
    expect(boutEnds.length).toBe(1); // only the pre-existing one
  });

  it('no BOUT_END when both endurance > 0', () => {
    const { events } = run({
      enduranceA: 1000,
      enduranceD: 1000,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const boutEnds = events.filter((e) => e.type === 'BOUT_END');
    expect(boutEnds.length).toBe(0);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('applyEnduranceCosts — edge cases', () => {
  it('surfaceMod enduranceMult = 0: att drain 0, def drain floored to 1', () => {
    const { fA, fD } = run({ arenaEndMult: 0, fAWeaponPenalty: 10, fDWeaponPenalty: 10 });
    expect(1000 - fA.endurance).toBe(0);
    expect(1000 - fD.endurance).toBe(1);
  });

  it('negative endurance not clamped (no Math.max(0, ...) in function)', () => {
    const { fA } = run({
      enduranceA: 5,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    expect(fA.endurance).toBeLessThan(0);
    expect(fA.endurance).toBe(5 - expectedAttDrain({ ...BASE }));
  });

  it('weather staminaMult interacts with surfaceEnduranceMult', () => {
    const { fA } = run({
      weather: 'Sweltering' as WeatherType,
      arenaEndMult: 1.25,
      fAWeaponPenalty: 10,
      fDWeaponPenalty: 10,
    });
    const attExp = expectedAttDrain({
      ...BASE,
      weather: 'Sweltering' as WeatherType,
      arenaEndMult: 1.25,
    });
    expect(1000 - fA.endurance).toBe(attExp);
    // Verify both multipliers stack: Sweltering staminaMult=1.3, arena=1.25
    expect(attExp).toBe(
      Math.round(enduranceCost(10, 10, 'Sweltering') * 10 * 1.25)
    );
  });
});
