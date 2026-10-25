// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { canonTargetingBias } from '@/engine/ai/matchup/canonTargeting';
import { FightingStyle } from '@/types/shared.types';

const TP = FightingStyle.TotalParry;
const AB = FightingStyle.AimedBlow;
const LU = FightingStyle.LungingAttack;
const ST = FightingStyle.StrikingAttack;

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

describe('canonTargetingBias — non-doctrine styles', () => {
  it('returns 0 for styles with no canon challenge/avoid lore', () => {
    expect(canonTargetingBias(ST, LU)).toBe(0);
  });
});
