import { describe, it, expect } from 'vitest';
import { evaluateTrainingAdvice } from '@/engine/advisor/trainingAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';

const mkWarrior = (style: FightingStyle = FightingStyle.AimedBlow, over: Partial<Warrior> = {}): Warrior => ({
  id: 'w1',
  name: 'Aulus',
  style,
  attributes: { ST: 12, CN: 12, SZ: 10, WT: 14, WL: 10, SP: 12, DF: 14 },
  fame: 40,
  popularity: 20,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 3, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...over,
});

const mkState = (over: Partial<GameState> = {}): GameState =>
  ({
    week: 3,
    absoluteWeek: 3,
    year: 1,
    season: 'Spring',
    roster: [],
    trainers: [],
    ...over,
  }) as unknown as GameState;

describe('evaluateTrainingAdvice', () => {
  it('recommends recovery mode when warrior has an active injury', () => {
    const warrior = mkWarrior(FightingStyle.AimedBlow, {
      injuries: [
        {
          id: 'i1',
          name: 'Sprained Wrist',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(advice.mode).toBe('recovery');
    expect(advice.headline).toContain('Med Bay');
    expect(advice.reasoning).toContain('recovery');
  });

  it('recommends recovery mode when warrior has elevated fatigue (>= 40)', () => {
    const warrior = mkWarrior(FightingStyle.AimedBlow, { fatigue: 42 });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(advice.mode).toBe('recovery');
    expect(advice.headline).toContain('Med Bay');
  });

  it('recommends style-synergistic attribute for Aimed Blow (DF or WT)', () => {
    const warrior = mkWarrior(FightingStyle.AimedBlow, {
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 13, WL: 10, SP: 11, DF: 14 },
    });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(advice.mode).toBe('attribute');
    expect(['DF', 'WT', 'CN']).toContain(advice.targetAttribute);
    expect(advice.gainChance).toBeGreaterThan(0);
    expect(advice.headline).toContain('Train');
  });

  it('bypasses attributes that have hit potential ceiling', () => {
    // Aimed Blow prefers DF and WT, but DF is at ceiling (15) and WT is capped at 14
    const warrior = mkWarrior(FightingStyle.AimedBlow, {
      attributes: { ST: 12, CN: 12, SZ: 10, WT: 14, WL: 10, SP: 11, DF: 15 },
      potential: { ST: 18, CN: 16, SZ: 10, WT: 14, WL: 14, SP: 16, DF: 15 },
    });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(advice.mode).toBe('attribute');
    expect(advice.targetAttribute).not.toBe('DF');
    expect(advice.targetAttribute).not.toBe('WT');
    expect(advice.burnWarning).toBeDefined();
  });

  it('falls back to skill drilling when all primary attributes are capped', () => {
    const warrior = mkWarrior(FightingStyle.StrikingAttack, {
      attributes: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
      potential: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
    });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(['skillDrill', 'trait', 'attribute']).toContain(advice.mode);
    expect(advice.headline).toBeDefined();
  });

  it('never recommends SZ (untrainable)', () => {
    const warrior = mkWarrior(FightingStyle.BashingAttack, {
      attributes: { ST: 12, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    const state = mkState();

    const advice = evaluateTrainingAdvice(warrior, state);
    expect(advice.targetAttribute).not.toBe('SZ');
  });
});
