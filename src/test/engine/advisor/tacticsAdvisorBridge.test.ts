import { describe, it, expect } from 'vitest';
import { evaluateTacticsAdvice } from '@/engine/advisor/tacticsAdvisorBridge';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import { makeFightSummary, makeGameState } from '@/test/_fixtures/factories';

const mkWarrior = (style: FightingStyle = FightingStyle.LungingAttack, over: Partial<Warrior> = {}): Warrior => ({
  id: 'w1' as any,
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

  it('applies rematch patience deltas when warrior holds a losing record vs the opponent', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const state = makeGameState({
      arenaHistory: [
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'D' }),
        makeFightSummary({ warriorIdA: 'opp1' as any, warriorIdD: 'w1' as any, winner: 'A' }),
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'D' }),
      ],
    });

    const base = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    const adjusted = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });

    // 0-3 record → patience delta capped at 2 (mirrors G11 rematch adaptation)
    expect(adjusted.suggestedOE).toBe(Math.max(1, base.suggestedOE - 2));
    expect(adjusted.suggestedAL).toBe(Math.min(10, base.suggestedAL + 2));
    expect(adjusted.gearNotes.some((n) => /rematch/i.test(n))).toBe(true);
  });

  it('shifts to counter-tempo when scout intel reports an aggressive opponent plan', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const state = makeGameState({
      insightTokens: [
        {
          id: 'tok1' as any,
          type: 'Tactic',
          warriorId: 'opp1' as any,
          warriorName: 'Marcus',
          detail: 'Suspected OE: High, AL: High',
          discoveredWeek: 4,
        },
      ],
    });

    const base = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    const adjusted = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });

    expect(adjusted.suggestedOE).toBe(Math.max(1, base.suggestedOE - 1));
    expect(adjusted.suggestedAL).toBe(Math.min(10, base.suggestedAL + 1));
    expect(adjusted.gearNotes.some((n) => /counter|aggressive|tempo/i.test(n))).toBe(true);
  });

  it('presses the tempo when scout intel reports a passive opponent plan', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const state = makeGameState({
      insightTokens: [
        {
          id: 'tok1' as any,
          type: 'Tactic',
          warriorId: 'opp1' as any,
          warriorName: 'Marcus',
          detail: 'Suspected OE: Low, AL: Low',
          discoveredWeek: 4,
        },
      ],
    });

    const base = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    const adjusted = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });

    expect(adjusted.suggestedOE).toBe(Math.min(10, base.suggestedOE + 1));
    expect(adjusted.suggestedAL).toBe(Math.max(1, base.suggestedAL - 1));
  });

  it('makes no counter-tempo adjustment on Medium or absent opponent intel', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const medium = makeGameState({
      insightTokens: [
        {
          id: 'tok1' as any,
          type: 'Tactic',
          warriorId: 'opp1' as any,
          warriorName: 'Marcus',
          detail: 'Suspected OE: Medium, AL: Medium',
          discoveredWeek: 4,
        },
      ],
    });
    const none = makeGameState({ insightTokens: [] });

    const base = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    const vsMedium = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state: medium });
    const vsNone = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state: none });

    expect(vsMedium.suggestedOE).toBe(base.suggestedOE);
    expect(vsMedium.suggestedAL).toBe(base.suggestedAL);
    expect(vsNone.suggestedOE).toBe(base.suggestedOE);
    expect(vsNone.suggestedAL).toBe(base.suggestedAL);
  });

  it('leaves tactics untouched when the record vs opponent is even or winning', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const state = makeGameState({
      arenaHistory: [
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'A' }),
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'A' }),
      ],
    });

    const base = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER');
    const adjusted = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });

    expect(adjusted.suggestedOE).toBe(base.suggestedOE);
    expect(adjusted.suggestedAL).toBe(base.suggestedAL);
    expect(adjusted.gearNotes.some((n) => /rematch/i.test(n))).toBe(false);
  });
});
