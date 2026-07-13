/**
 * AI Strategic Levers — exhaustive branch coverage for getAITarget, getAIProtect,
 * getAIAggressionBias, getAIOpeningMove, getAIRangePreference, getAITactics.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  getAITarget,
  getAIProtect,
  getAIAggressionBias,
  getAIOpeningMove,
  getAIRangePreference,
  getAITactics,
} from '@/engine/ai/plan/levers';

describe('levers — getAITarget', () => {
  it('returns Any when intent is RECOVERY', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Aggressive', 5, 'RECOVERY')).toBe('Any');
  });

  it('returns Head when intent is VENDETTA', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Pragmatic', 3, 'VENDETTA')).toBe('Head');
  });

  it('returns Head when killDesire >= 8', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Pragmatic', 8)).toBe('Head');
    expect(getAITarget(FightingStyle.StrikingAttack, 'Pragmatic', 10)).toBe('Head');
  });

  it('returns Head when killDesire is exactly 8 (boundary)', () => {
    expect(getAITarget(FightingStyle.BashingAttack, 'Aggressive', 8)).toBe('Head');
  });

  it('returns Head when style is AimedBlow regardless of other factors', () => {
    expect(getAITarget(FightingStyle.AimedBlow, 'Pragmatic', 0)).toBe('Head');
  });

  it('returns Right Leg when personality is Tactician (and not recovery/vendetta/high killDesire/AimedBlow)', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Tactician', 3)).toBe('Right Leg');
  });

  it('returns Right Leg when personality is Methodical', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Methodical', 3)).toBe('Right Leg');
  });

  it('returns Chest when personality is Aggressive', () => {
    expect(getAITarget(FightingStyle.TotalParry, 'Aggressive', 3)).toBe('Chest');
  });

  it('returns Chest when style is aggressive (BashingAttack)', () => {
    expect(getAITarget(FightingStyle.BashingAttack, 'Pragmatic', 3)).toBe('Chest');
  });

  it('returns Chest when style is aggressive (StrikingAttack)', () => {
    expect(getAITarget(FightingStyle.StrikingAttack, 'Pragmatic', 3)).toBe('Chest');
  });

  it('returns Chest when style is aggressive (LungingAttack)', () => {
    expect(getAITarget(FightingStyle.LungingAttack, 'Pragmatic', 3)).toBe('Chest');
  });

  it('returns Chest when style is aggressive (SlashingAttack)', () => {
    expect(getAITarget(FightingStyle.SlashingAttack, 'Pragmatic', 3)).toBe('Chest');
  });

  it('returns Any as default (Showman, non-aggressive style, low killDesire)', () => {
    expect(getAITarget(FightingStyle.TotalParry, 'Showman', 3)).toBe('Any');
  });

  it('returns Any as default (Pragmatic, defensive style, low killDesire)', () => {
    expect(getAITarget(FightingStyle.ParryRiposte, 'Pragmatic', 3)).toBe('Any');
  });

  it('RECOVERY intent overrides all other conditions', () => {
    expect(getAITarget(FightingStyle.AimedBlow, 'Aggressive', 10, 'RECOVERY')).toBe('Any');
  });

  it('VENDETTA intent takes priority over Tactician personality', () => {
    expect(getAITarget(FightingStyle.TotalParry, 'Tactician', 3, 'VENDETTA')).toBe('Head');
  });

  it('high killDesire takes priority over Tactician personality', () => {
    expect(getAITarget(FightingStyle.TotalParry, 'Tactician', 9)).toBe('Head');
  });

  it('AimedBlow takes priority over Tactician personality', () => {
    expect(getAITarget(FightingStyle.AimedBlow, 'Tactician', 3)).toBe('Head');
  });

  it('Tactician takes priority over aggressive style', () => {
    expect(getAITarget(FightingStyle.BashingAttack, 'Tactician', 3)).toBe('Right Leg');
  });
});

describe('levers — getAIProtect', () => {
  it('returns Head when intent is RECOVERY', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Aggressive', 'RECOVERY')).toBe('Head');
  });

  it('returns Head when style is defensive (TotalParry)', () => {
    expect(getAIProtect(FightingStyle.TotalParry, 'Aggressive')).toBe('Head');
  });

  it('returns Head when style is defensive (WallOfSteel)', () => {
    expect(getAIProtect(FightingStyle.WallOfSteel, 'Aggressive')).toBe('Head');
  });

  it('returns Head when style is defensive (ParryRiposte)', () => {
    expect(getAIProtect(FightingStyle.ParryRiposte, 'Aggressive')).toBe('Head');
  });

  it('returns Head when style is defensive (ParryStrike)', () => {
    expect(getAIProtect(FightingStyle.ParryStrike, 'Aggressive')).toBe('Head');
  });

  it('returns Head when style is defensive (ParryLunge)', () => {
    expect(getAIProtect(FightingStyle.ParryLunge, 'Aggressive')).toBe('Head');
  });

  it('returns Body when personality is Methodical (non-defensive style)', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Methodical')).toBe('Body');
  });

  it('returns Body when personality is Pragmatic (non-defensive style)', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Pragmatic')).toBe('Body');
  });

  it('returns Any when personality is Aggressive and style is not defensive', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Aggressive')).toBe('Any');
  });

  it('returns Any when personality is Showman and style is not defensive', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Showman')).toBe('Any');
  });

  it('returns Any when personality is Tactician and style is not defensive', () => {
    expect(getAIProtect(FightingStyle.StrikingAttack, 'Tactician')).toBe('Any');
  });

  it('RECOVERY intent overrides defensive style check (both return Head)', () => {
    expect(getAIProtect(FightingStyle.TotalParry, 'Aggressive', 'RECOVERY')).toBe('Head');
  });

  it('defensive style overrides Methodical personality', () => {
    expect(getAIProtect(FightingStyle.ParryRiposte, 'Methodical')).toBe('Head');
  });
});

describe('levers — getAIAggressionBias', () => {
  it('returns 7 for Aggressive personality', () => {
    expect(getAIAggressionBias('Aggressive')).toBe(7);
  });

  it('returns 6 for Showman personality', () => {
    expect(getAIAggressionBias('Showman')).toBe(6);
  });

  it('returns 4 for Methodical personality', () => {
    expect(getAIAggressionBias('Methodical')).toBe(4);
  });

  it('returns 4 for Tactician personality', () => {
    expect(getAIAggressionBias('Tactician')).toBe(4);
  });

  it('returns 5 for Pragmatic personality (default)', () => {
    expect(getAIAggressionBias('Pragmatic')).toBe(5);
  });

  it('adds +1 for VENDETTA intent', () => {
    expect(getAIAggressionBias('Aggressive', 'VENDETTA')).toBe(8);
    expect(getAIAggressionBias('Pragmatic', 'VENDETTA')).toBe(6);
  });

  it('subtracts -2 for RECOVERY intent', () => {
    expect(getAIAggressionBias('Aggressive', 'RECOVERY')).toBe(5);
    expect(getAIAggressionBias('Pragmatic', 'RECOVERY')).toBe(3);
  });

  it('adds 0 for other intents (CONSOLIDATION, EXPANSION, etc.)', () => {
    expect(getAIAggressionBias('Aggressive', 'CONSOLIDATION')).toBe(7);
    expect(getAIAggressionBias('Pragmatic', 'EXPANSION')).toBe(5);
  });

  it('clamps to 0 minimum (Methodical + RECOVERY = 2, not clamped)', () => {
    expect(getAIAggressionBias('Methodical', 'RECOVERY')).toBe(2);
  });

  it('clamps to 10 maximum (Aggressive + VENDETTA = 8, not clamped)', () => {
    expect(getAIAggressionBias('Aggressive', 'VENDETTA')).toBe(8);
  });
});

describe('levers — getAIOpeningMove', () => {
  it('returns Aggressive for Aggressive personality', () => {
    expect(getAIOpeningMove('Aggressive')).toBe('Aggressive');
  });

  it('returns Aggressive for Showman personality', () => {
    expect(getAIOpeningMove('Showman')).toBe('Aggressive');
  });

  it('returns Safe for Methodical personality', () => {
    expect(getAIOpeningMove('Methodical')).toBe('Safe');
  });

  it('returns Safe for Tactician personality', () => {
    expect(getAIOpeningMove('Tactician')).toBe('Safe');
  });

  it('returns Measured for Pragmatic personality (default)', () => {
    expect(getAIOpeningMove('Pragmatic')).toBe('Measured');
  });
});

describe('levers — getAIRangePreference', () => {
  it('returns Extended for LungingAttack', () => {
    expect(getAIRangePreference(FightingStyle.LungingAttack)).toBe('Extended');
  });

  it('returns Extended for ParryLunge', () => {
    expect(getAIRangePreference(FightingStyle.ParryLunge)).toBe('Extended');
  });

  it('returns Tight for BashingAttack', () => {
    expect(getAIRangePreference(FightingStyle.BashingAttack)).toBe('Tight');
  });

  it('returns Tight for WallOfSteel', () => {
    expect(getAIRangePreference(FightingStyle.WallOfSteel)).toBe('Tight');
  });

  it('returns Striking for AimedBlow', () => {
    expect(getAIRangePreference(FightingStyle.AimedBlow)).toBe('Striking');
  });

  it('returns undefined for StrikingAttack', () => {
    expect(getAIRangePreference(FightingStyle.StrikingAttack)).toBeUndefined();
  });

  it('returns undefined for SlashingAttack', () => {
    expect(getAIRangePreference(FightingStyle.SlashingAttack)).toBeUndefined();
  });

  it('returns undefined for ParryRiposte', () => {
    expect(getAIRangePreference(FightingStyle.ParryRiposte)).toBeUndefined();
  });

  it('returns undefined for ParryStrike', () => {
    expect(getAIRangePreference(FightingStyle.ParryStrike)).toBeUndefined();
  });

  it('returns undefined for TotalParry', () => {
    expect(getAIRangePreference(FightingStyle.TotalParry)).toBeUndefined();
  });
});

describe('levers — getAITactics', () => {
  it('returns Slash/Dodge for AimedBlow', () => {
    expect(getAITactics(FightingStyle.AimedBlow)).toEqual({
      offTactic: 'Slash',
      defTactic: 'Dodge',
    });
  });

  it('returns Bash/none for BashingAttack', () => {
    expect(getAITactics(FightingStyle.BashingAttack)).toEqual({
      offTactic: 'Bash',
      defTactic: 'none',
    });
  });

  it('returns Lunge/Dodge for LungingAttack', () => {
    expect(getAITactics(FightingStyle.LungingAttack)).toEqual({
      offTactic: 'Lunge',
      defTactic: 'Dodge',
    });
  });

  it('returns Lunge/Parry for ParryLunge', () => {
    expect(getAITactics(FightingStyle.ParryLunge)).toEqual({
      offTactic: 'Lunge',
      defTactic: 'Parry',
    });
  });

  it('returns none/Parry for ParryRiposte', () => {
    expect(getAITactics(FightingStyle.ParryRiposte)).toEqual({
      offTactic: 'none',
      defTactic: 'Parry',
    });
  });

  it('returns Decisiveness/Parry for ParryStrike', () => {
    expect(getAITactics(FightingStyle.ParryStrike)).toEqual({
      offTactic: 'Decisiveness',
      defTactic: 'Parry',
    });
  });

  it('returns Slash/none for SlashingAttack', () => {
    expect(getAITactics(FightingStyle.SlashingAttack)).toEqual({
      offTactic: 'Slash',
      defTactic: 'none',
    });
  });

  it('returns Decisiveness/none for StrikingAttack', () => {
    expect(getAITactics(FightingStyle.StrikingAttack)).toEqual({
      offTactic: 'Decisiveness',
      defTactic: 'none',
    });
  });

  it('returns none/Parry for TotalParry', () => {
    expect(getAITactics(FightingStyle.TotalParry)).toEqual({
      offTactic: 'none',
      defTactic: 'Parry',
    });
  });

  it('returns Bash/Parry for WallOfSteel', () => {
    expect(getAITactics(FightingStyle.WallOfSteel)).toEqual({
      offTactic: 'Bash',
      defTactic: 'Parry',
    });
  });

  it('returns none/none for unknown style (default branch)', () => {
    expect(getAITactics('UnknownStyle' as FightingStyle)).toEqual({
      offTactic: 'none',
      defTactic: 'none',
    });
  });

  it('returns valid OffensiveTactic and DefensiveTactic for all real styles', () => {
    const validOff = ['Lunge', 'Slash', 'Bash', 'Decisiveness', 'none'];
    const validDef = ['Dodge', 'Parry', 'Riposte', 'Responsiveness', 'none'];
    for (const style of Object.values(FightingStyle)) {
      const result = getAITactics(style);
      expect(validOff).toContain(result.offTactic);
      expect(validDef).toContain(result.defTactic);
    }
  });
});
