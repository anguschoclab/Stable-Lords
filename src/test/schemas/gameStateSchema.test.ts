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
} from '@/schemas/schemaEnums';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import type { StableId } from '@/types/shared.types';

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

  it('megaplan fields survive a JSON save/load round-trip', async () => {
    const { createFreshState } = await import('@/engine/factories/gameStateFactory');
    const { populateInitialWorld } = await import('@/engine/core/worldSeeder');

    const state = populateInitialWorld(createFreshState('rt-seed'), 42);
    // Founder queue: queue a real seeded warrior.
    const founder = state.roster[0]!;
    state.legacyFounderQueue = [founder];
    // Free-agent shelf: reuse a pool warrior shape.
    state.freeAgents = [
      { ...state.recruitPool[0]!, id: 'fa-1', addedWeek: 5, weeksOnMarket: 2 },
    ] as any;
    // Founder lineage on a rival owner.
    const rival = state.rivals[0]!;
    rival.owner.foundedByWarriorId = founder.id;
    rival.owner.foundedByWarriorName = founder.name;
    rival.owner.parentStableId = 'rival-parent-1' as StableId;
    rival.owner.generation = 2;
    rival.weeksBelowMin = 3;

    const parsed = GameStateSchema.parse(JSON.parse(JSON.stringify(state)));

    expect(parsed.legacyFounderQueue.map((w: any) => w.id)).toEqual([founder.id]);
    expect(parsed.freeAgents[0].id).toBe('fa-1');
    const parsedRival = parsed.rivals[0]!;
    expect(parsedRival.owner.foundedByWarriorId).toBe(founder.id);
    expect(parsedRival.owner.foundedByWarriorName).toBe(founder.name);
    expect(parsedRival.owner.parentStableId).toBe('rival-parent-1');
    expect(parsedRival.owner.generation).toBe(2);
    expect(parsedRival.weeksBelowMin).toBe(3);
  });

  it('death-registry fields survive a JSON save/load round-trip', async () => {
    // deadWarriorIds is append-only and must NEVER be dropped by the schema —
    // it is the liveness authority once the graveyard truncates at 200.
    const { createFreshState } = await import('@/engine/factories/gameStateFactory');
    const state = createFreshState('rt-death-seed');
    state.deadWarriorIds = ['w-dead-1' as never, 'w-dead-2' as never];
    state.killEvents = [
      {
        id: 'ke-1',
        week: 10,
        victimId: 'w-dead-1' as never,
        killerId: 'w-killer' as never,
        tournamentId: 't-3' as never,
      },
    ];

    const parsed = GameStateSchema.parse(JSON.parse(JSON.stringify(state)));

    expect(parsed.deadWarriorIds).toEqual(['w-dead-1', 'w-dead-2']);
    expect(parsed.killEvents).toHaveLength(1);
    expect(parsed.killEvents[0]).toMatchObject({
      victimId: 'w-dead-1',
      killerId: 'w-killer',
      tournamentId: 't-3',
    });
  });
});
