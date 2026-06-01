import { describe, it, expect } from 'vitest';
import { computeStrategyScore, getScoreColor } from '@/engine/strategyAnalysis';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

function createPlan(style: FightingStyle, overrides?: Partial<FightPlan>): FightPlan {
  return {
    style,
    OE: 5,
    AL: 5,
    target: 'Any',
    protect: 'Any',
    ...overrides,
  };
}

function createWarrior(attributesOverride?: Partial<Warrior['attributes']>, otherOverrides?: Partial<Warrior>): Warrior {
  const baseAttributes = {
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
  };

  return {
    id: 'test-warrior-1' as any,
    name: 'Test Warrior',
    style: FightingStyle.BashingAttack,
    attributes: {
      ...baseAttributes,
      ...attributesOverride,
    },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    ...otherOverrides,
  };
}

describe('computeStrategyScore', () => {
  describe('base score', () => {
    it('returns 60 for a minimal plan with no warrior and no tactics', () => {
      const plan = createPlan(FightingStyle.BashingAttack);
      expect(computeStrategyScore(plan)).toBe(60);
    });
  });

  describe('offensive tactic suitability', () => {
    it('adds +15 for WS-rated offensive tactic', () => {
      const plan = createPlan(FightingStyle.AimedBlow, { offensiveTactic: 'Lunge' });
      expect(computeStrategyScore(plan)).toBe(75);
    });

    it('adds +5 for S-rated offensive tactic', () => {
      const plan = createPlan(FightingStyle.LungingAttack, { offensiveTactic: 'Decisiveness' });
      expect(computeStrategyScore(plan)).toBe(65);
    });

    it('subtracts -25 for U-rated offensive tactic', () => {
      const plan = createPlan(FightingStyle.TotalParry, { offensiveTactic: 'Lunge' });
      expect(computeStrategyScore(plan)).toBe(35);
    });

    it('does not modify score when offensive tactic is none', () => {
      const plan = createPlan(FightingStyle.BashingAttack, { offensiveTactic: 'none' });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not modify score when offensive tactic is omitted', () => {
      const plan = createPlan(FightingStyle.BashingAttack);
      expect(computeStrategyScore(plan)).toBe(60);
    });
  });

  describe('low-WT skill penalty (offensive)', () => {
    it('applies -30 penalty for WS-rated tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.AimedBlow, { offensiveTactic: 'Lunge' });
      expect(computeStrategyScore(plan, warrior)).toBe(45);
    });

    it('does not penalize S-rated tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.LungingAttack, { offensiveTactic: 'Decisiveness' });
      expect(computeStrategyScore(plan, warrior)).toBe(65);
    });

    it('does not penalize U-rated tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.TotalParry, { offensiveTactic: 'Lunge' });
      expect(computeStrategyScore(plan, warrior)).toBe(35);
    });
  });

  describe('defensive tactic suitability', () => {
    it('adds +15 for WS-rated defensive tactic', () => {
      const plan = createPlan(FightingStyle.TotalParry, { defensiveTactic: 'Dodge' });
      expect(computeStrategyScore(plan)).toBe(75);
    });

    it('adds +5 for S-rated defensive tactic', () => {
      const plan = createPlan(FightingStyle.AimedBlow, { defensiveTactic: 'Parry' });
      expect(computeStrategyScore(plan)).toBe(65);
    });

    it('subtracts -25 for U-rated defensive tactic', () => {
      const plan = createPlan(FightingStyle.BashingAttack, { defensiveTactic: 'Dodge' });
      expect(computeStrategyScore(plan)).toBe(35);
    });

    it('does not modify score when defensive tactic is none', () => {
      const plan = createPlan(FightingStyle.BashingAttack, { defensiveTactic: 'none' });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not modify score when defensive tactic is omitted', () => {
      const plan = createPlan(FightingStyle.BashingAttack);
      expect(computeStrategyScore(plan)).toBe(60);
    });
  });

  describe('low-WT skill penalty (defensive)', () => {
    it('applies -30 penalty for WS-rated defensive tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.TotalParry, { defensiveTactic: 'Dodge' });
      expect(computeStrategyScore(plan, warrior)).toBe(45);
    });

    it('does not penalize S-rated defensive tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.AimedBlow, { defensiveTactic: 'Parry' });
      expect(computeStrategyScore(plan, warrior)).toBe(65);
    });

    it('does not penalize U-rated defensive tactic when WT < 10', () => {
      const warrior = createWarrior({ WT: 9 });
      const plan = createPlan(FightingStyle.BashingAttack, { defensiveTactic: 'Dodge' });
      expect(computeStrategyScore(plan, warrior)).toBe(35);
    });
  });

  describe('effort-attribute synergy — OE', () => {
    it('adds +10 when OE >= 7 and ST >= 18', () => {
      const warrior = createWarrior({ ST: 18 });
      // Use AimedBlow (tempo=0) to avoid tempo bonus confounding
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(70);
    });

    it('adds +10 when OE >= 7 and SP >= 18', () => {
      const warrior = createWarrior({ SP: 18 });
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(70);
    });

    it('subtracts -15 when OE >= 7 and ST < 10 and SP < 10', () => {
      const warrior = createWarrior({ ST: 9, SP: 9 });
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(45);
    });

    it('does not apply OE bonus when OE < 7', () => {
      const warrior = createWarrior({ ST: 18 });
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 6 });
      expect(computeStrategyScore(plan, warrior)).toBe(60);
    });

    it('does not apply OE penalty when OE < 7', () => {
      const warrior = createWarrior({ ST: 9, SP: 9 });
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 6 });
      expect(computeStrategyScore(plan, warrior)).toBe(60);
    });
  });

  describe('effort-attribute synergy — AL', () => {
    it('adds +10 when AL >= 7 and WT >= 18', () => {
      const warrior = createWarrior({ WT: 18 });
      const plan = createPlan(FightingStyle.BashingAttack, { AL: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(70);
    });

    it('adds +10 when AL >= 7 and DF >= 18', () => {
      const warrior = createWarrior({ DF: 18 });
      const plan = createPlan(FightingStyle.BashingAttack, { AL: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(70);
    });

    it('subtracts -15 when AL >= 7 and WT < 10 and DF < 10', () => {
      const warrior = createWarrior({ WT: 9, DF: 9 });
      const plan = createPlan(FightingStyle.BashingAttack, { AL: 7 });
      expect(computeStrategyScore(plan, warrior)).toBe(45);
    });

    it('does not apply AL bonus when AL < 7', () => {
      const warrior = createWarrior({ WT: 18 });
      const plan = createPlan(FightingStyle.BashingAttack, { AL: 6 });
      expect(computeStrategyScore(plan, warrior)).toBe(60);
    });

    it('does not apply AL penalty when AL < 7', () => {
      const warrior = createWarrior({ WT: 9, DF: 9 });
      const plan = createPlan(FightingStyle.BashingAttack, { AL: 6 });
      expect(computeStrategyScore(plan, warrior)).toBe(60);
    });
  });

  describe('total-effort penalties', () => {
    it('subtracts (total - 16) * 8 when total effort > 16', () => {
      // Use AimedBlow (tempo=0) to avoid tempo bonus confounding
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 10, AL: 10 });
      expect(computeStrategyScore(plan)).toBe(28); // 60 - (20 - 16) * 8 = 60 - 32
    });

    it('subtracts (6 - total) * 5 when total effort < 6', () => {
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 2, AL: 2 });
      expect(computeStrategyScore(plan)).toBe(50); // 60 - (6 - 4) * 5 = 60 - 10
    });

    it('does not apply penalty when total effort is exactly 6', () => {
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 3, AL: 3 });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not apply penalty when total effort is between 6 and 16', () => {
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 8, AL: 8 });
      expect(computeStrategyScore(plan)).toBe(60);
    });
  });

  describe('tempo synergy', () => {
    it('adds +10 when OE >= 7 and opening tempo > 0', () => {
      // BashingAttack has opening tempo of 1
      const plan = createPlan(FightingStyle.BashingAttack, { OE: 7 });
      expect(computeStrategyScore(plan)).toBe(70);
    });

    it('adds +10 when OE <= 4 and opening tempo < 0', () => {
      // TotalParry has opening tempo of -1
      const plan = createPlan(FightingStyle.TotalParry, { OE: 4 });
      expect(computeStrategyScore(plan)).toBe(70);
    });

    it('does not add tempo bonus when OE >= 7 but tempo is 0', () => {
      // AimedBlow has opening tempo of 0
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 7 });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not add tempo bonus when OE >= 7 but tempo is negative', () => {
      // TotalParry has opening tempo of -1
      const plan = createPlan(FightingStyle.TotalParry, { OE: 7 });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not add tempo bonus when OE <= 4 but tempo is 0', () => {
      // AimedBlow has opening tempo of 0
      const plan = createPlan(FightingStyle.AimedBlow, { OE: 4 });
      expect(computeStrategyScore(plan)).toBe(60);
    });

    it('does not add tempo bonus when OE <= 4 but tempo is positive', () => {
      // BashingAttack has opening tempo of 1
      const plan = createPlan(FightingStyle.BashingAttack, { OE: 4 });
      expect(computeStrategyScore(plan)).toBe(60);
    });
  });

  describe('combined interactions', () => {
    it('correctly stacks multiple bonuses', () => {
      // BashingAttack + OE=7 + ST=18 + offensive Bash (WS) + positive opening tempo
      const warrior = createWarrior({ ST: 18 });
      const plan = createPlan(FightingStyle.BashingAttack, {
        OE: 7,
        offensiveTactic: 'Bash',
      });
      expect(computeStrategyScore(plan, warrior)).toBe(95); // 60 + 15 + 10 + 10
    });

    it('correctly stacks multiple penalties', () => {
      // TotalParry + OE=10 + AL=10 + offensive Lunge (U) + low ST/SP + low WT/DF
      const warrior = createWarrior({ ST: 9, SP: 9, WT: 9, DF: 9 });
      const plan = createPlan(FightingStyle.TotalParry, {
        OE: 10,
        AL: 10,
        offensiveTactic: 'Lunge',
      });
      // 60 - 25 (U) - 15 (low ST/SP) - 15 (low WT/DF) - 32 (over-exertion) = -27 → clamped to 0
      expect(computeStrategyScore(plan, warrior)).toBe(0);
    });
  });

  describe('clamping', () => {
    it('clamps score to 0 when calculated score is below 0', () => {
      // TotalParry + OE=10 + AL=10 + offensive Lunge (U) = 60 - 25 - 32 = 3 (not clamped)
      // To actually trigger clamping, add a warrior with low attributes to incur more penalties
      const warrior = createWarrior({ ST: 9, SP: 9, WT: 9, DF: 9 });
      const plan = createPlan(FightingStyle.TotalParry, {
        OE: 10,
        AL: 10,
        offensiveTactic: 'Lunge',
      });
      // 60 - 25 (U) - 15 (low ST/SP) - 15 (low WT/DF) - 32 (over-exertion) = -27 → clamped to 0
      expect(computeStrategyScore(plan, warrior)).toBe(0);
    });

    it('clamps score to 100 when calculated score exceeds 100', () => {
      // StrikingAttack: offensive WS for all tactics, defensive Responsiveness = WS, tempo = +1
      const warrior = createWarrior({ ST: 18, WT: 18 });
      const plan = createPlan(FightingStyle.StrikingAttack, {
        OE: 7,
        AL: 7,
        offensiveTactic: 'Lunge',
        defensiveTactic: 'Responsiveness',
      });
      // 60 + 15 (off WS) + 15 (def WS) + 10 (OE high + ST high) + 10 (AL high + WT high) + 10 (tempo) = 120 → clamped to 100
      expect(computeStrategyScore(plan, warrior)).toBe(100);
    });
  });
});

describe('getScoreColor', () => {
  it('returns gold classes for score >= 85', () => {
    expect(getScoreColor(90)).toBe('text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]');
    expect(getScoreColor(85)).toBe('text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]');
  });

  it('returns primary class for score 70–84', () => {
    expect(getScoreColor(75)).toBe('text-primary');
    expect(getScoreColor(70)).toBe('text-primary');
  });

  it('returns arena-pop class for score 50–69', () => {
    expect(getScoreColor(60)).toBe('text-arena-pop');
    expect(getScoreColor(50)).toBe('text-arena-pop');
  });

  it('returns destructive class for score < 50', () => {
    expect(getScoreColor(40)).toBe('text-destructive');
    expect(getScoreColor(0)).toBe('text-destructive');
  });
});
