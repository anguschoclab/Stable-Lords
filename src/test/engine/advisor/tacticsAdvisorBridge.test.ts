import { describe, it, expect } from 'vitest';
import { evaluateTacticsAdvice } from '@/engine/advisor/tacticsAdvisorBridge';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import { makeFightSummary, makeGameState } from '@/test/_fixtures/factories';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';

const mkWarrior = (style: FightingStyle = FightingStyle.LungingAttack, over: Partial<Warrior> = {}): Warrior =>
  fixtureWarrior({
  id: 'w1' as any,
  name: 'Marcus',
  style,
  attributes: { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 },
  popularity: 20,
  career: { wins: 4, losses: 1, kills: 0 },
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

describe('suggested conditions (plan triggers)', () => {
  it('recommends a tempo-shield condition vs a known killer', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const killer = mkWarrior(FightingStyle.BashingAttack, {
      id: 'opp1' as any,
      career: { wins: 9, losses: 1, kills: 2 },
    });
    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', {
      opponent: killer,
      state: makeGameState({}),
    });

    const shield = advice.suggestedConditions?.find(
      (c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD'
    );
    expect(shield).toBeDefined();
    expect(shield?.label).toBeTruthy();
  });

  it('recommends a tempo-shield on a losing rematch record', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const state = makeGameState({
      arenaHistory: [
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'D' }),
        makeFightSummary({ warriorIdA: 'opp1' as any, warriorIdD: 'w1' as any, winner: 'A' }),
        makeFightSummary({ warriorIdA: 'w1' as any, warriorIdD: 'opp1' as any, winner: 'D' }),
      ],
    });

    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });
    expect(
      advice.suggestedConditions?.some((c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD')
    ).toBe(true);
  });

  it('recommends a survival ramp for REHABILITATION and exhausted fighters', () => {
    const rehab = evaluateTacticsAdvice(mkWarrior(FightingStyle.TotalParry), 'REHABILITATION');
    expect(
      rehab.suggestedConditions?.some((c) => c.trigger.type === 'ENDURANCE_BELOW')
    ).toBe(true);

    const exhausted = evaluateTacticsAdvice(
      mkWarrior(FightingStyle.BashingAttack, { fatigue: 45 }),
      'PURSE_HUNTER'
    );
    expect(
      exhausted.suggestedConditions?.some((c) => c.trigger.type === 'ENDURANCE_BELOW')
    ).toBe(true);
  });

  it('recommends a gassed-opponent press when intel reports a passive plan', () => {
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

    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', { opponent, state });
    expect(
      advice.suggestedConditions?.some((c) => c.trigger.type === 'OPPONENT_ENDURANCE_BELOW')
    ).toBe(true);
  });

  it('recommends a kill-window press for a healthy warrior with a scouted opponent', () => {
    const warrior = mkWarrior(FightingStyle.LungingAttack, { id: 'w1' as any });
    const opponent = mkWarrior(FightingStyle.ParryStrike, { id: 'opp1' as any });
    const advice = evaluateTacticsAdvice(warrior, 'PURSE_HUNTER', {
      opponent,
      state: makeGameState({}),
    });
    expect(
      advice.suggestedConditions?.some((c) => c.trigger.type === 'OPPONENT_HP_BELOW')
    ).toBe(true);
  });

  it('suggests no conditions without an opponent context on a healthy warrior', () => {
    const advice = evaluateTacticsAdvice(mkWarrior(FightingStyle.LungingAttack), 'PURSE_HUNTER');
    expect(advice.suggestedConditions ?? []).toHaveLength(0);
  });
});
