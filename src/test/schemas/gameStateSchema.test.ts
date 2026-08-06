import { describe, it, expect } from 'vitest';
import {
  FightingStyleSchema,
  SeasonSchema,
  CrowdMoodTypeSchema,
  WeatherTypeSchema,
  WarriorStatusSchema,
  InjurySeveritySchema,
  PromoterTierSchema,
  OffensiveTacticSchema,
  DefensiveTacticSchema,
  GameStateSchema,
} from '@/schemas/gameStateSchema';

describe('gameStateSchema — enum schemas', () => {
  it('FightingStyleSchema accepts valid styles', () => {
    expect(FightingStyleSchema.parse('STRIKING ATTACK')).toBe('STRIKING ATTACK');
    expect(FightingStyleSchema.parse('BASHING ATTACK')).toBe('BASHING ATTACK');
  });

  it('FightingStyleSchema rejects invalid style', () => {
    expect(() => FightingStyleSchema.parse('INVALID')).toThrow();
  });

  it('SeasonSchema accepts all four seasons', () => {
    for (const s of ['Spring', 'Summer', 'Fall', 'Winter']) {
      expect(SeasonSchema.parse(s)).toBe(s);
    }
  });

  it('SeasonSchema rejects invalid season', () => {
    expect(() => SeasonSchema.parse('Autumn')).toThrow();
  });

  it('CrowdMoodTypeSchema accepts valid moods', () => {
    for (const m of ['Calm', 'Bloodthirsty', 'Theatrical', 'Solemn', 'Festive']) {
      expect(CrowdMoodTypeSchema.parse(m)).toBe(m);
    }
  });

  it('CrowdMoodTypeSchema rejects invalid mood', () => {
    expect(() => CrowdMoodTypeSchema.parse('Angry')).toThrow();
  });

  it('WeatherTypeSchema accepts Clear', () => {
    expect(WeatherTypeSchema.parse('Clear')).toBe('Clear');
  });

  it('WeatherTypeSchema rejects invalid weather', () => {
    expect(() => WeatherTypeSchema.parse('Snow')).toThrow();
  });

  it('WarriorStatusSchema accepts Active, Dead, Retired', () => {
    for (const s of ['Active', 'Dead', 'Retired']) {
      expect(WarriorStatusSchema.parse(s)).toBe(s);
    }
  });

  it('WarriorStatusSchema rejects invalid status', () => {
    expect(() => WarriorStatusSchema.parse('Injured')).toThrow();
  });

  it('InjurySeveritySchema accepts valid severities', () => {
    for (const s of ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent']) {
      expect(() => InjurySeveritySchema.parse(s)).not.toThrow();
    }
  });

  it('PromoterTierSchema accepts all tiers', () => {
    for (const t of ['Local', 'Regional', 'National', 'Legendary']) {
      expect(PromoterTierSchema.parse(t)).toBe(t);
    }
  });

  it('OffensiveTacticSchema accepts valid tactics', () => {
    for (const t of ['Lunge', 'Slash', 'Bash', 'Decisiveness', 'none']) {
      expect(OffensiveTacticSchema.parse(t)).toBe(t);
    }
  });

  it('DefensiveTacticSchema rejects invalid tactic', () => {
    expect(() => DefensiveTacticSchema.parse('Block')).toThrow();
  });
});

describe('gameStateSchema — GameStateSchema', () => {
  it('rejects empty object', () => {
    expect(() => GameStateSchema.parse({})).toThrow();
  });

  it('rejects null', () => {
    expect(() => GameStateSchema.parse(null)).toThrow();
  });

  it('rejects non-object types', () => {
    expect(() => GameStateSchema.parse('string')).toThrow();
    expect(() => GameStateSchema.parse(42)).toThrow();
    expect(() => GameStateSchema.parse([])).toThrow();
  });

  it('requires meta field with gameName, version, createdAt', () => {
    const result = GameStateSchema.safeParse({
      meta: { gameName: 'Test' },
    });
    expect(result.success).toBe(false);
  });

  it('requires phase field to be planning or resolution', () => {
    const result = GameStateSchema.safeParse({
      meta: { gameName: 'T', version: '1', createdAt: '2024' },
      phase: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('requires ftueComplete to be boolean', () => {
    const result = GameStateSchema.safeParse({
      meta: { gameName: 'T', version: '1', createdAt: '2024' },
      ftueComplete: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('uses .strict() to reject unknown fields', () => {
    const result = GameStateSchema.safeParse({
      meta: { gameName: 'T', version: '1', createdAt: '2024', extra: true },
    });
    expect(result.success).toBe(false);
  });
});
