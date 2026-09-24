import { describe, it, expect } from 'vitest';
import { evaluateTrainingAdvice } from '@/engine/advisor/trainingAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';

const mkWarrior = (style: FightingStyle = FightingStyle.AimedBlow, over: Partial<Warrior> = {}): Warrior => ({
  id: 'w1' as any,
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

const mkTrainer = (id: string, over: Partial<Trainer> = {}): Trainer => ({
  id,
  name: `Trainer ${id}`,
  tier: 'Seasoned',
  focus: 'Mind',
  fame: 30,
  age: 45,
  contractWeeksLeft: 8,
  ...over,
});

describe('evaluateTrainingAdvice', () => {
  it('recommends recovery mode when warrior has an active injury', () => {
    const warrior = mkWarrior(FightingStyle.AimedBlow, {
      injuries: [
        {
          id: 'i1' as any,
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

  describe('trainer matching (targetTrainerId)', () => {
    it('recovery mode prefers a Healing-focus trainer', () => {
      const warrior = mkWarrior(FightingStyle.AimedBlow, { fatigue: 45 });
      const heal = mkTrainer('t-heal', { focus: 'Healing', tier: 'Novice' });
      const aggro = mkTrainer('t-aggro', { focus: 'Aggression', tier: 'Master' });
      const state = mkState({ trainers: [aggro, heal] });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.mode).toBe('recovery');
      expect(advice.targetTrainerId).toBe('t-heal');
    });

    it('skips trainers with expired contracts', () => {
      const warrior = mkWarrior(FightingStyle.AimedBlow, { fatigue: 45 });
      const expired = mkTrainer('t-old', { focus: 'Healing', tier: 'Master', contractWeeksLeft: 0 });
      const active = mkTrainer('t-new', { focus: 'Aggression', tier: 'Novice' });
      const state = mkState({ trainers: [expired, active] });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.targetTrainerId).toBe('t-new');
    });

    it('attribute mode picks a trainer whose focus covers the target attribute (FOCUS_ATTR_MAP)', () => {
      // Bashing Attack primary is ST — covered by Aggression and Endurance focus.
      const warrior = mkWarrior(FightingStyle.BashingAttack, {
        attributes: { ST: 12, CN: 18, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      });
      const mind = mkTrainer('t-mind', { focus: 'Mind', tier: 'Master' });
      const aggro = mkTrainer('t-aggro', { focus: 'Aggression', tier: 'Seasoned' });
      const state = mkState({ trainers: [mind, aggro], season: 'Fall' });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.mode).toBe('attribute');
      expect(advice.targetAttribute).toBe('ST');
      expect(advice.targetTrainerId).toBe('t-aggro');
    });

    it('downgrades trainer pick when treasury cannot cover the weekly salary', () => {
      const warrior = mkWarrior(FightingStyle.BashingAttack, {
        attributes: { ST: 12, CN: 18, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      });
      const master = mkTrainer('t-master', { focus: 'Aggression', tier: 'Master' });
      const novice = mkTrainer('t-novice', { focus: 'Aggression', tier: 'Novice' });
      // TRAINER_WEEKLY_SALARY: Master 75, Novice 10
      const state = mkState({ trainers: [master, novice], treasury: 50, season: 'Fall' });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.targetTrainerId).toBe('t-novice');
      expect(advice.reasoning).toMatch(/treasury|afford/i);
    });

    it('defers trait training when treasury cannot cover any contracted trainer', () => {
      const warrior = mkWarrior(FightingStyle.StrikingAttack, {
        attributes: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
        potential: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
        skillDrills: { ATT: 3, PAR: 3, DEF: 3, INI: 3, RIP: 3, DEC: 3 },
      });
      const master = mkTrainer('t-master', { tier: 'Master' });
      const state = mkState({ trainers: [master], treasury: 0 });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.mode).toBe('trait');
      expect(advice.targetTrainerId).toBeUndefined();
      expect(advice.reasoning).toMatch(/treasury|defer|afford/i);
    });

    it('trait mode sets targetTrainerId preferring style-affinity trainer', () => {
      const warrior = mkWarrior(FightingStyle.StrikingAttack, {
        attributes: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
        potential: { ST: 20, CN: 18, SZ: 12, WT: 18, WL: 16, SP: 16, DF: 16 },
        skillDrills: { ATT: 3, PAR: 3, DEF: 3, INI: 3, RIP: 3, DEC: 3 },
      });
      const generic = mkTrainer('t-gen', { tier: 'Master' });
      const styled = mkTrainer('t-style', {
        tier: 'Novice',
        styleBonusStyle: FightingStyle.StrikingAttack,
      });
      const state = mkState({ trainers: [generic, styled] });

      const advice = evaluateTrainingAdvice(warrior, state);
      expect(advice.mode).toBe('trait');
      expect(advice.targetTrainerId).toBe('t-style');
    });
  });
});
