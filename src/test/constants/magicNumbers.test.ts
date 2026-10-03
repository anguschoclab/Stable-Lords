/**
 * Megaplan Phase 5 — magic-number sweep guard. Asserts the world-population
 * files that used to carry bare literals now read the named constants, and
 * that the constants themselves carry the megaplan values.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  WORLD_RIVAL_FLOOR,
  WORLD_RIVAL_SOFT_CAP,
  WORLD_RIVAL_HARD_CAP,
  ORGANIC_LICENSE_CHANCE,
  EXPANSION_MINT_ATTEMPTS,
  LEGACY_FOUND_CHANCE,
  FREE_AGENT_SHELF_WEEKS,
} from '@/constants/world';
import { ARENA_TITLE, ARENA_SELECTION, ARENA_ROSTER_LIMITS } from '@/constants/arena';

const src = (p: string) => readFileSync(resolve(__dirname, '../../', p), 'utf8');

describe('world-population constants carry the megaplan values', () => {
  it('population bounds and churn knobs', () => {
    expect(WORLD_RIVAL_FLOOR).toBe(90);
    expect(WORLD_RIVAL_SOFT_CAP).toBeGreaterThan(WORLD_RIVAL_FLOOR);
    expect(WORLD_RIVAL_HARD_CAP).toBeGreaterThan(WORLD_RIVAL_SOFT_CAP);
    expect(ORGANIC_LICENSE_CHANCE).toBeGreaterThan(0);
    expect(ORGANIC_LICENSE_CHANCE).toBeLessThanOrEqual(1);
    expect(EXPANSION_MINT_ATTEMPTS).toBeGreaterThanOrEqual(4);
    expect(LEGACY_FOUND_CHANCE).toBeGreaterThan(0.25);
    expect(FREE_AGENT_SHELF_WEEKS).toBeGreaterThan(0);
  });

  it('arena selection + title scaling constants', () => {
    expect(ARENA_SELECTION.TIER_2_FAME_THRESHOLD).toBe(50);
    expect(ARENA_SELECTION.TIER_3_FAME_THRESHOLD).toBe(150);
    expect(ARENA_SELECTION.HOME_VENUE_WEIGHT_MAX).toBeLessThanOrEqual(
      ARENA_SELECTION.HOME_VENUE_FIT_BONUS
    );
    expect(ARENA_SELECTION.UNDERSERVED_ARENA_WEIGHT).toBeGreaterThan(0);
    expect(ARENA_TITLE.MIN_TITLE_BOUTS_PER_WEEK).toBe(3);
    expect(ARENA_TITLE).not.toHaveProperty('MAX_TITLE_BOUTS_PER_WEEK');
  });

  it('arena roster caps reflect the 50-normal + 2-special curation', () => {
    // Curation removes 1 normal arena and designates 2 special venues —
    // normal cap 50, total 52, t1 12, t2 25, t3 17.
    expect(ARENA_ROSTER_LIMITS.TOTAL_CAP).toBe(52);
    expect(ARENA_ROSTER_LIMITS.NORMAL_CAP).toBe(50);
    expect(ARENA_ROSTER_LIMITS.TIER_CAPS).toEqual({ 1: 12, 2: 25, 3: 17 });
  });
});

describe('representative call sites use the named constants', () => {
  const cases: [file: string, mustContain: RegExp, mustNotContain?: RegExp][] = [
    [
      'engine/core/worldSeeder.ts',
      /WORLD_RIVAL_FLOOR[\s\S]*PROMOTERS_PER_STABLE/,
      /generateRivalStables\(\s*45\b/,
    ],
    ['engine/ai/stableManager.ts', /WORLD_RIVAL_FLOOR/, /<=\s*45\b/],
    [
      'engine/ai/expansionService.ts',
      /ORGANIC_LICENSE_CHANCE[\s\S]*EXPANSION_MINT_ATTEMPTS|EXPANSION_MINT_ATTEMPTS[\s\S]*ORGANIC_LICENSE_CHANCE/,
    ],
    [
      'engine/ai/workers/rosterWorker.ts',
      /AI_GEAR_(COST|CHAMPION_TREASURY_GATE|EXPANSION_TREASURY_GATE)/,
    ],
    ['engine/ai/seasonalRetirementService.ts', /LEGACY_FOUND_CHANCE/],
    ['engine/ai/legacyFounder.ts', /LEGACY_FOUNDER_(FAME_MIN|WINS_MIN|KILLS_MIN|FAME_HOF)/],
    ['engine/pipeline/passes/WarriorPass.ts', /LEGACY_FOUNDER_TRAINER_CHANCE/],
    [
      'engine/championship/arenaChampionship/phases/scheduling.ts',
      /titleBoutsPerWeekCap/,
      /MAX_TITLE_BOUTS_PER_WEEK/,
    ],
    ['engine/matchmaking/arenaFit.ts', /eligibleArenasFor[\s\S]*TIER_2_FAME_THRESHOLD/],
  ];

  for (const [file, mustContain, mustNotContain] of cases) {
    it(`${file} reads constants, not literals`, () => {
      const text = src(file);
      expect(text).toMatch(mustContain);
      if (mustNotContain) expect(text).not.toMatch(mustNotContain);
    });
  }
});
