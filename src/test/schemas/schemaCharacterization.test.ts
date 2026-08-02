import { describe, it, expect } from 'vitest';
import {
  GameStateSchema,
  FightingStyleSchema,
  SeasonSchema,
  WarriorStatusSchema,
  InjurySeveritySchema,
  PromoterTierSchema,
  OwnerPersonalitySchema,
  BoutOfferStatusSchema,
  FightOutcomeBySchema,
  CombatEventTypeSchema,
  DeathCauseBucketSchema,
  AIIntentSchema,
  AnnualAwardTypeSchema,
  AttributesSchema,
  BaseSkillsSchema,
  NewsletterItemSchema,
  InjuryDataSchema,
  TrainerSchema,
  InsightTokenSchema,
  SaveSlotMetaSchema,
} from '@/schemas/gameStateSchema';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('schema characterization', () => {
  describe('enum schemas accept valid values', () => {
    it('FightingStyleSchema accepts all fighting styles', () => {
      const styles = [
        'AIMED BLOW', 'BASHING ATTACK', 'LUNGING ATTACK', 'PARRY-LUNGE',
        'PARRY-RIPOSTE', 'PARRY-STRIKE', 'SLASHING ATTACK', 'STRIKING ATTACK',
        'TOTAL PARRY', 'WALL OF STEEL',
      ];
      for (const s of styles) {
        expect(FightingStyleSchema.safeParse(s).success, `${s} should be valid`).toBe(true);
      }
    });

    it('FightingStyleSchema rejects invalid values', () => {
      expect(FightingStyleSchema.safeParse('INVALID').success).toBe(false);
      expect(FightingStyleSchema.safeParse('').success).toBe(false);
      expect(FightingStyleSchema.safeParse(123).success).toBe(false);
    });

    it('SeasonSchema accepts all seasons', () => {
      for (const s of ['Spring', 'Summer', 'Fall', 'Winter']) {
        expect(SeasonSchema.safeParse(s).success, `${s} should be valid`).toBe(true);
      }
    });

    it('SeasonSchema rejects invalid values', () => {
      expect(SeasonSchema.safeParse('Autumn').success).toBe(false);
    });

    it('WarriorStatusSchema accepts valid statuses', () => {
      for (const s of ['Active', 'Dead', 'Retired']) {
        expect(WarriorStatusSchema.safeParse(s).success).toBe(true);
      }
    });

    it('InjurySeveritySchema accepts valid severities', () => {
      for (const s of ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent']) {
        expect(InjurySeveritySchema.safeParse(s).success, `${s} should be valid`).toBe(true);
      }
    });

    it('PromoterTierSchema accepts valid tiers', () => {
      for (const t of ['Local', 'Regional', 'National', 'Legendary']) {
        expect(PromoterTierSchema.safeParse(t).success).toBe(true);
      }
    });

    it('OwnerPersonalitySchema accepts valid personalities', () => {
      for (const p of ['Aggressive', 'Methodical', 'Showman', 'Pragmatic', 'Tactician']) {
        expect(OwnerPersonalitySchema.safeParse(p).success, `${p} should be valid`).toBe(true);
      }
    });

    it('BoutOfferStatusSchema accepts valid statuses', () => {
      for (const s of ['Proposed', 'Signed', 'Rejected', 'Expired']) {
        expect(BoutOfferStatusSchema.safeParse(s).success, `${s} should be valid`).toBe(true);
      }
    });

    it('FightOutcomeBySchema accepts valid outcomes', () => {
      for (const o of ['Kill', 'KO', 'Exhaustion', 'Stoppage', 'Draw', 'null']) {
        expect(FightOutcomeBySchema.safeParse(o).success, `${o} should be valid`).toBe(true);
      }
    });

    it('CombatEventTypeSchema accepts valid event types', () => {
      const types = ['INITIATIVE', 'ATTACK', 'DEFENSE', 'HIT', 'CONTEST', 'ENDURANCE', 'FATIGUE', 'STATE_CHANGE', 'BOUT_END', 'PASSIVE', 'INSIGHT', 'MOMENTUM_SHIFT', 'RANGE_SHIFT', 'FEINT_SUCCESS', 'FEINT_FAIL', 'ZONE_SHIFT'];
      for (const t of types) {
        expect(CombatEventTypeSchema.safeParse(t).success, `${t} should be valid`).toBe(true);
      }
    });

    it('DeathCauseBucketSchema accepts valid buckets', () => {
      for (const b of ['FATAL_DAMAGE', 'EXECUTION', 'CRITICAL_CHAIN']) {
        expect(DeathCauseBucketSchema.safeParse(b).success, `${b} should be valid`).toBe(true);
      }
    });

    it('AIIntentSchema accepts valid intents', () => {
      for (const i of ['EXPANSION', 'CONSOLIDATION', 'VENDETTA', 'RECOVERY', 'SURVIVAL', 'WEALTH_ACCUMULATION', 'AGGRESSIVE_EXPANSION', 'ROSTER_DIVERSITY']) {
        expect(AIIntentSchema.safeParse(i).success, `${i} should be valid`).toBe(true);
      }
    });

    it('AnnualAwardTypeSchema accepts valid award types', () => {
      for (const a of ['WARRIOR_OF_YEAR', 'KILLER_OF_YEAR', 'STABLE_OF_YEAR', 'CLASS_MVP', 'TOURNAMENT_RANK']) {
        expect(AnnualAwardTypeSchema.safeParse(a).success, `${a} should be valid`).toBe(true);
      }
    });
  });

  describe('object schemas validate correctly', () => {
    it('AttributesSchema accepts valid range (3-25)', () => {
      const valid = { ST: 3, CN: 25, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 };
      expect(AttributesSchema.safeParse(valid).success).toBe(true);
    });

    it('AttributesSchema rejects out-of-range values', () => {
      expect(AttributesSchema.safeParse({ ST: 2, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }).success).toBe(false);
      expect(AttributesSchema.safeParse({ ST: 26, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }).success).toBe(false);
    });

    it('BaseSkillsSchema accepts non-negative values', () => {
      expect(BaseSkillsSchema.safeParse({ ATT: 0, PAR: 10, DEF: 5, INI: 3, RIP: 0, DEC: 2 }).success).toBe(true);
      expect(BaseSkillsSchema.safeParse({ ATT: -1, PAR: 10, DEF: 5, INI: 3, RIP: 0, DEC: 2 }).success).toBe(false);
    });

    it('NewsletterItemSchema accepts valid item', () => {
      const item = { id: 'nl-1', week: 1, title: 'Test', items: ['line 1'] };
      expect(NewsletterItemSchema.safeParse(item).success).toBe(true);
    });

    it('InjuryDataSchema accepts valid injury', () => {
      const injury = {
        id: 'inj-1', name: 'Broken Arm', description: 'Ouch',
        severity: 'Severe', weeksRemaining: 3, penalties: { ATT: -2 },
      };
      expect(InjuryDataSchema.safeParse(injury).success).toBe(true);
    });

    it('InsightTokenSchema accepts valid token', () => {
      const token = {
        id: 'tok-1', type: 'Style', warriorId: 'w-1', warriorName: 'Alice',
        detail: 'Found a style insight', discoveredWeek: 5,
      };
      expect(InsightTokenSchema.safeParse(token).success).toBe(true);
    });

    it('InsightTokenSchema rejects invalid type', () => {
      const token = {
        id: 'tok-1', type: 'Invalid', warriorId: 'w-1', warriorName: 'Alice',
        detail: 'Bad', discoveredWeek: 5,
      };
      expect(InsightTokenSchema.safeParse(token).success).toBe(false);
    });

    it('TrainerSchema accepts valid trainer', () => {
      const trainer = {
        id: 't-1', name: 'Bob', tier: 'Master', focus: 'Defense',
        fame: 50, age: 45, contractWeeksLeft: 12,
      };
      expect(TrainerSchema.safeParse(trainer).success).toBe(true);
    });

    it('SaveSlotMetaSchema accepts valid meta', () => {
      const meta = { id: 'slot-1', name: 'Save 1', week: 10, year: 2, timestamp: '2024-01-01T00:00:00Z', version: '1.0' };
      expect(SaveSlotMetaSchema.safeParse(meta).success).toBe(true);
    });
  });

  describe('GameStateSchema validates fresh state', () => {
    it('createFreshState produces a GameState that passes schema (excluding known extra fields)', () => {
      const state = createFreshState('test-seed', '2024-01-01T00:00:00Z');
      // createFreshState includes absoluteWeek which GameStateSchema.strict() rejects.
      // This is a pre-existing mismatch — document it as current behavior.
      const { absoluteWeek, ...rest } = state;
      const result = GameStateSchema.safeParse(rest);
      expect(result.success, result.success ? '' : JSON.stringify(result.error.issues, null, 2)).toBe(true);
    });

    it('createFreshState includes absoluteWeek (pre-existing schema mismatch documented)', () => {
      const state = createFreshState('test-seed', '2024-01-01T00:00:00Z');
      expect((state as any).absoluteWeek).toBeDefined();
      // GameStateSchema.strict() rejects this field — pre-existing issue
      const fullResult = GameStateSchema.safeParse(state);
      expect(fullResult.success).toBe(false);
    });

    it('GameStateSchema rejects missing required fields', () => {
      expect(GameStateSchema.safeParse({}).success).toBe(false);
    });

    it('GameStateSchema rejects unknown fields (strict mode)', () => {
      const state = createFreshState('test-seed', '2024-01-01T00:00:00Z');
      const { absoluteWeek, ...rest } = state;
      const withExtra = { ...rest, unknownField: 'bad' };
      expect(GameStateSchema.safeParse(withExtra).success).toBe(false);
    });
  });
});
