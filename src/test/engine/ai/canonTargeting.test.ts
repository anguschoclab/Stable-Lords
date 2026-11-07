// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { canonTargetingBias } from '@/engine/ai/matchup/canonTargeting';
import { FightingStyle } from '@/types/shared.types';

const TP = FightingStyle.TotalParry;
const AB = FightingStyle.AimedBlow;
const LU = FightingStyle.LungingAttack;
const ST = FightingStyle.StrikingAttack;
const SL = FightingStyle.SlashingAttack;

describe('canonTargetingBias — TP doctrine', () => {
  it('hard-avoids ABs (canon 90-95% loss — the nemesis)', () => {
    expect(canonTargetingBias(TP, AB)).toBeLessThanOrEqual(-3);
  });

  it('hunts lungers (canon 60-80% win — best friend)', () => {
    expect(canonTargetingBias(TP, LU)).toBeGreaterThan(2);
  });

  it('avoids hard-hitters', () => {
    expect(canonTargetingBias(TP, ST)).toBeLessThan(0);
  });

  it('rookie TPs (<10 FE) soften their avoids — challenge all styles but AB', () => {
    const veteran = canonTargetingBias(TP, ST, 15);
    const rookie = canonTargetingBias(TP, ST, 5);
    expect(Math.abs(rookie)).toBeLessThan(Math.abs(veteran));
    expect(rookie).toBeLessThan(0);
  });
});

describe('canonTargetingBias — AB doctrine', () => {
  it('hunts scum (TP) hardest', () => {
    expect(canonTargetingBias(AB, TP)).toBeGreaterThanOrEqual(3);
  });

  it('avoids lungers "like the plague"', () => {
    expect(canonTargetingBias(AB, LU)).toBeLessThanOrEqual(-3);
  });

  it('prefers defensive styles over offensives', () => {
    const def = canonTargetingBias(AB, FightingStyle.ParryRiposte);
    const off = canonTargetingBias(AB, FightingStyle.BashingAttack);
    expect(def).toBeGreaterThan(0);
    expect(off).toBeLessThan(0);
  });
});

describe('canonTargetingBias — PR doctrine', () => {
  const PR = FightingStyle.ParryRiposte;

  it('hunts strikers — the natural striker-killer', () => {
    expect(canonTargetingBias(PR, ST)).toBeGreaterThanOrEqual(2);
  });

  it('hunts scum (TP) — ripostes starve the shell', () => {
    expect(canonTargetingBias(PR, TP)).toBeGreaterThanOrEqual(1);
  });

  it('hard-avoids aimed blows — "the bane" of rippers', () => {
    expect(canonTargetingBias(PR, AB)).toBeLessThanOrEqual(-3);
  });

  it('avoids slashers — a "pretty tough" matchup for rippers', () => {
    expect(canonTargetingBias(PR, FightingStyle.SlashingAttack)).toBeLessThan(0);
  });

  it('is neutral on lungers', () => {
    expect(canonTargetingBias(PR, LU)).toBe(0);
  });
});

describe('canonTargetingBias — SL doctrine', () => {
  const SL = FightingStyle.SlashingAttack;

  it('hunts lungers — canon says slashers eat them', () => {
    expect(canonTargetingBias(SL, LU)).toBeGreaterThanOrEqual(2);
  });

  it('aims over parry-riposters — "PR types give us fits but we usually win"', () => {
    expect(canonTargetingBias(SL, FightingStyle.ParryRiposte)).toBeGreaterThan(0);
  });

  it('fears the long-haul scum — the worst style to be out against', () => {
    expect(canonTargetingBias(SL, TP)).toBeLessThanOrEqual(-2);
  });

  it('respects decisive strikers and the defensive walls', () => {
    expect(canonTargetingBias(SL, ST)).toBeLessThan(0);
    expect(canonTargetingBias(SL, FightingStyle.WallOfSteel)).toBeLessThan(0);
  });

  it('has no steer against aimed blows', () => {
    expect(canonTargetingBias(SL, FightingStyle.AimedBlow)).toBe(0);
  });
});

describe('canonTargetingBias — PL doctrine (Arena 93)', () => {
  const PL = FightingStyle.ParryLunge;

  it('preys on strikers, pikers, rippers, and slashers — the AP article\'s hunting list', () => {
    expect(canonTargetingBias(PL, ST)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(PL, FightingStyle.ParryStrike)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(PL, FightingStyle.ParryRiposte)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(PL, SL)).toBeGreaterThan(0);
  });

  it('stays cautious of lungers and bashers — biddable, never the hard-avoid band', () => {
    const veteran = 15;
    const lu = canonTargetingBias(PL, LU, veteran);
    const ba = canonTargetingBias(PL, FightingStyle.BashingAttack, veteran);
    expect(lu).toBeLessThanOrEqual(-2);
    expect(ba).toBeLessThanOrEqual(-2);
    // "Always remain cautious" — but the style graduates, so veterans still bid.
    expect(lu).toBeGreaterThan(-3);
    expect(ba).toBeGreaterThan(-3);
  });

  it('rookie parry-lungers refuse the heavy hitters outright — canon "stay away"', () => {
    const rookie = 5;
    expect(canonTargetingBias(PL, LU, rookie)).toBeLessThanOrEqual(-3);
    expect(canonTargetingBias(PL, FightingStyle.BashingAttack, rookie)).toBeLessThanOrEqual(-3);
  });

  it('gives scum a mild steer — the burn-out risk Tripwire warns about', () => {
    expect(canonTargetingBias(PL, TP)).toBeLessThan(0);
  });
});

describe('canonTargetingBias — ST doctrine (Arena 93)', () => {
  const WS = FightingStyle.WallOfSteel;
  const BA = FightingStyle.BashingAttack;
  const SL = FightingStyle.SlashingAttack;
  const PL = FightingStyle.ParryLunge;
  const PR = FightingStyle.ParryRiposte;

  it('hunts bashers and slashers — Assur\'s best matchups', () => {
    expect(canonTargetingBias(ST, BA)).toBeGreaterThanOrEqual(1.5);
    expect(canonTargetingBias(ST, SL)).toBeGreaterThanOrEqual(1.5);
  });

  it('hunts parry-lungers and aimed blows', () => {
    expect(canonTargetingBias(ST, PL)).toBeGreaterThan(1);
    expect(canonTargetingBias(ST, AB)).toBeGreaterThan(1);
  });

  it('hunts scum and lungers — the Blind Man grind, the Crimson decise edge', () => {
    expect(canonTargetingBias(ST, TP)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(ST, LU)).toBeGreaterThan(0);
  });

  it('avoids parry-ripostes and walls — worst matchups, above the hard-avoid band', () => {
    const pr = canonTargetingBias(ST, PR);
    const ws = canonTargetingBias(ST, WS);
    expect(pr).toBeLessThanOrEqual(-2);
    expect(ws).toBeLessThan(0);
    // Strikers stay biddable — never cross the ≤ −3 hard-avoid tripwire.
    expect(pr).toBeGreaterThan(-3);
    expect(ws).toBeGreaterThan(-3);
  });
});

describe('canonTargetingBias — WS doctrine (Arena 93 wall articles)', () => {
  const WS = FightingStyle.WallOfSteel;
  const BA = FightingStyle.BashingAttack;
  const SL = FightingStyle.SlashingAttack;
  const ST = FightingStyle.StrikingAttack;
  const TP = FightingStyle.TotalParry;
  const PR = FightingStyle.ParryRiposte;
  const PS = FightingStyle.ParryStrike;
  const PL = FightingStyle.ParryLunge;

  it('hunts the fast offensives — Dante loves watching bashers and slashers get nowhere', () => {
    expect(canonTargetingBias(WS, BA)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(WS, SL)).toBeGreaterThan(0);
    expect(canonTargetingBias(WS, ST)).toBeGreaterThan(0);
  });

  it('avoids lungers and aimed blows — "not recommended"; way OP at end-game', () => {
    expect(canonTargetingBias(WS, LU)).toBeLessThanOrEqual(-1);
    expect(canonTargetingBias(WS, AB)).toBeLessThanOrEqual(-1);
  });

  it('shows mild scum caution — She-Puppy: slow down or be scummed', () => {
    expect(canonTargetingBias(WS, TP)).toBeLessThan(0);
    expect(canonTargetingBias(WS, PR)).toBeLessThan(0);
    expect(canonTargetingBias(WS, PS)).toBeLessThan(0);
    expect(canonTargetingBias(WS, PL)).toBeLessThan(0);
  });

  it('never hard-avoids — canon walls "challenge pretty much any style"', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(canonTargetingBias(WS, style)).toBeGreaterThan(-3);
    }
  });
});

describe('canonTargetingBias — LU doctrine (Arena 93)', () => {
  it('hard-avoids plate scum — "pure scum in Plate Armor!!! Avoid like the plague!"', () => {
    expect(canonTargetingBias(LU, TP)).toBeLessThanOrEqual(-3);
  });

  it('feeds on strikers and bashers — Assur\'s best matchups', () => {
    expect(canonTargetingBias(LU, ST)).toBeGreaterThanOrEqual(2);
    expect(canonTargetingBias(LU, FightingStyle.BashingAttack)).toBeGreaterThanOrEqual(2);
  });

  it('hunts the hybrids — "other hybrids ... are probably your best matchups"', () => {
    expect(canonTargetingBias(LU, FightingStyle.ParryStrike)).toBeGreaterThanOrEqual(1);
    expect(canonTargetingBias(LU, FightingStyle.ParryLunge)).toBeGreaterThanOrEqual(1);
  });

  it('respects the high-attack defenses and slashers — cautious, never the plague band', () => {
    for (const opp of [
      FightingStyle.SlashingAttack,
      FightingStyle.WallOfSteel,
      FightingStyle.ParryRiposte,
    ]) {
      const bias = canonTargetingBias(LU, opp);
      expect(bias).toBeLessThan(0);
      expect(bias).toBeGreaterThan(-3);
    }
  });
});

describe('canonTargetingBias — non-doctrine styles', () => {
  it('returns 0 for styles with no canon challenge/avoid lore', () => {
    expect(canonTargetingBias(FightingStyle.BashingAttack, LU)).toBe(0);
  });
});
