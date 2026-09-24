import { describe, it, expect } from 'vitest';
import { evaluateTacticsAdvice } from '@/engine/advisor/tacticsAdvisorBridge';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';

const mkWarrior = (style: FightingStyle = FightingStyle.LungingAttack, over: Partial<Warrior> = {}): Warrior => ({
  id: 'w1',
  name: 'Marcus',
  style,
  attributes: { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 },
  fame: 50,
  popularity: 20,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 4, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...over,
});

describe('evaluateTacticsAdvice', () => {
  it('selects best offensive and defensive tactics matching tacticAdvisor payoff', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack);
    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');

    expect(advice.bestOffensiveTactic).toBe(getBestOffensiveTactic(FightingStyle.LungingAttack));
    expect(advice.bestDefensiveTactic).toBe(getBestDefensiveTactic(FightingStyle.LungingAttack));
  });

  it('mandates YIELD fallback condition for REHABILITATION and VETERAN_TWILIGHT fighters', () => {
    const rehabWarrior = mkWarrior(FightingStyle.TotalParry);
    const twilightWarrior = mkWarrior(FightingStyle.TotalParry);

    const rehabAdvice = evaluateTacticsAdvice(rehabWarrior, 'REHABILITATION');
    const twilightAdvice = evaluateTacticsAdvice(twilightWarrior, 'VETERAN_TWILIGHT');

    expect(rehabAdvice.fallbackCondition).toBe('YIELD');
    expect(twilightAdvice.fallbackCondition).toBe('YIELD');
  });

  it('moderates OE and AL when warrior fatigue is elevated (>= 30)', () => {
    const warrior = mkWarrior(FightingStyle.BashingAttack, { fatigue: 35 });
    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');

    expect(advice.suggestedOE).toBeLessThanOrEqual(5);
    expect(advice.suggestedAL).toBeLessThanOrEqual(5);
  });

  it('audits equipment encumbrance for agile styles', () => {
    const warrior = mkWarrior(FightingStyle.SlashingAttack, {
      equipment: {
        armor: 'plate_armor',
        helm: 'full_helm',
      } as any,
    });

    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    expect(advice.gearNotes.some((n) => n.toLowerCase().includes('encumbrance') || n.toLowerCase().includes('plate'))).toBe(true);
  });
});
