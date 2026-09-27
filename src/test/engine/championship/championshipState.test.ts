// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { mergeImpacts, resolveImpacts } from '@/engine/impacts';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { ArenaTitleSchema, GrandChampionEntrySchema } from '@/schemas/fightSchemas';
import {
  isSeasonalTournamentWeek,
  isChampionsTournamentWeek,
  isTournamentWeekOfYear,
  weeksUntilNextSeasonalTournament,
  isSeasonalTournamentPrepWeek,
} from '@/engine/core/absoluteWeek';
import { ARENA_TITLE, CHAMPIONS_TOURNEY } from '@/constants/arena';
import type { ArenaTitle, GrandChampionEntry } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

function makeTitle(overrides: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: {
      warriorId: 'w-champ' as WarriorId,
      startedAbsoluteWeek: 10,
      defenses: 2,
      lastActivityWeek: 40,
    },
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...overrides,
  };
}

describe('Phase 1 — championship state plumbing', () => {
  it('fresh state initializes empty championship collections', () => {
    const state = createFreshState('championship-init');
    expect(state.arenaChampions).toEqual({});
    expect(state.grandChampions).toEqual([]);
  });

  it('arenaChampions impacts dict-merge per arena key', () => {
    const a = makeTitle();
    const b = makeTitle({ status: 'dormant', noContenderStreak: 3 });
    const merged = mergeImpacts([
      { arenaChampions: { arena_a: a } },
      { arenaChampions: { arena_b: b } },
    ]);
    expect(merged.arenaChampions?.['arena_a']).toEqual(a);
    expect(merged.arenaChampions?.['arena_b']).toEqual(b);
  });

  it('later arenaChampions impacts replace the whole ArenaTitle for a key', () => {
    const v1 = makeTitle();
    const v2 = makeTitle({ status: 'pendingReengagement', deferrals: 1 });
    const merged = mergeImpacts([
      { arenaChampions: { arena_a: v1 } },
      { arenaChampions: { arena_a: v2 } },
    ]);
    expect(merged.arenaChampions?.['arena_a']?.status).toBe('pendingReengagement');
    expect(merged.arenaChampions?.['arena_a']?.deferrals).toBe(1);
  });

  it('resolveImpacts applies arenaChampions into state without clobbering siblings', () => {
    const state = createFreshState('championship-resolve');
    state.arenaChampions = { arena_x: makeTitle() };
    const next = resolveImpacts(state, [{ arenaChampions: { arena_y: makeTitle() } }]);
    expect(Object.keys(next.arenaChampions ?? {}).sort()).toEqual(['arena_x', 'arena_y']);
  });

  it('grandChampions impacts append in order', () => {
    const e1: GrandChampionEntry = {
      tournamentId: 't1',
      year: 1,
      warriorId: 'w1' as WarriorId,
      warriorName: 'One',
    };
    const e2: GrandChampionEntry = {
      tournamentId: 't2',
      year: 2,
      warriorId: 'w2' as WarriorId,
      warriorName: 'Two',
    };
    const merged = mergeImpacts([{ grandChampions: [e1] }, { grandChampions: [e2] }]);
    expect(merged.grandChampions).toEqual([e1, e2]);

    const state = createFreshState('grand-champ');
    const next = resolveImpacts(state, [{ grandChampions: [e1, e2] }]);
    expect(next.grandChampions).toHaveLength(2);
  });
});

describe('Phase 1 — schema & legacy save compatibility', () => {
  it('ArenaTitleSchema round-trips a fully populated title', () => {
    const title = makeTitle({
      history: [
        {
          warriorId: 'w-old' as WarriorId,
          warriorName: 'Old Champ',
          stableName: 'Iron House',
          startedAbsoluteWeek: 1,
          endedAbsoluteWeek: 9,
          endReason: 'defeated',
          defenses: 3,
        },
      ],
      declinedContenders: { 'w-declined': 50 },
    });
    const parsed = ArenaTitleSchema.safeParse(JSON.parse(JSON.stringify(title)));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(title);
  });

  it('GrandChampionEntrySchema validates a winner record', () => {
    const parsed = GrandChampionEntrySchema.safeParse({
      tournamentId: 't1',
      year: 1,
      warriorId: 'w1',
      warriorName: 'Champ',
      stableName: 'Stable',
    });
    expect(parsed.success).toBe(true);
  });

  it('GameStateSchema accepts a state carrying championship data', () => {
    const state = createFreshState('schema-with-champs');
    state.arenaChampions = { arena_a: makeTitle() };
    state.grandChampions = [
      { tournamentId: 't', year: 1, warriorId: 'w1' as WarriorId, warriorName: 'W' },
    ];
    const parsed = GameStateSchema.safeParse(state);
    expect(parsed.success).toBe(true);
  });

  it('GameStateSchema accepts legacy saves lacking championship fields', () => {
    const state = createFreshState('schema-legacy');
    delete state.arenaChampions;
    delete state.grandChampions;
    const parsed = GameStateSchema.safeParse(JSON.parse(JSON.stringify(state)));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.arenaChampions).toBeUndefined();
      expect(parsed.data.grandChampions).toBeUndefined();
    }
  });
});

describe('Phase 1 — tournament calendar helpers', () => {
  it('identifies seasonal tournament weeks', () => {
    expect(isSeasonalTournamentWeek(10)).toBe(true);
    expect(isSeasonalTournamentWeek(20)).toBe(true);
    expect(isSeasonalTournamentWeek(30)).toBe(true);
    expect(isSeasonalTournamentWeek(42)).toBe(true);
    expect(isSeasonalTournamentWeek(13)).toBe(false);
    expect(isSeasonalTournamentWeek(52)).toBe(false);
  });

  it('identifies the champions tournament week and union helper', () => {
    expect(isChampionsTournamentWeek(52)).toBe(true);
    expect(isChampionsTournamentWeek(10)).toBe(false);
    expect(isTournamentWeekOfYear(52)).toBe(true);
    expect(isTournamentWeekOfYear(30)).toBe(true);
    expect(isTournamentWeekOfYear(5)).toBe(false);
  });

  it('accepts absolute weeks by converting to display week', () => {
    // Absolute week 62 = year 2, display week 10.
    expect(isSeasonalTournamentWeek(62)).toBe(true);
    // Absolute week 104 = year 2, display week 52.
    expect(isChampionsTournamentWeek(104)).toBe(true);
  });

  it('counts weeks until the next seasonal tournament, wrapping the year', () => {
    expect(weeksUntilNextSeasonalTournament(10)).toBe(0);
    expect(weeksUntilNextSeasonalTournament(11)).toBe(9);
    expect(weeksUntilNextSeasonalTournament(45)).toBe(17); // wraps to week 10
    expect(weeksUntilNextSeasonalTournament(52)).toBe(10); // 52 is champions, not seasonal
  });

  it('prep window is relative to the next seasonal week', () => {
    expect(isSeasonalTournamentPrepWeek(7)).toBe(true);
    expect(isSeasonalTournamentPrepWeek(9)).toBe(true);
    expect(isSeasonalTournamentPrepWeek(10)).toBe(false); // tournament week itself
    expect(isSeasonalTournamentPrepWeek(5)).toBe(false); // outside 4-week window
    expect(isSeasonalTournamentPrepWeek(39)).toBe(true); // run-up to week 42
    expect(isSeasonalTournamentPrepWeek(52)).toBe(false); // past week 42 → 10 weeks out
  });
});

describe('Phase 1 — constants sanity', () => {
  it('defense cadence approximates the normal bout cadence', () => {
    expect(ARENA_TITLE.DEFENSE_INTERVAL_WEEKS).toBeGreaterThanOrEqual(3);
    expect(ARENA_TITLE.DEFENSE_INTERVAL_WEEKS).toBeLessThanOrEqual(5);
  });

  it('ex-champion cooldown is longer than the challenger cooldown', () => {
    expect(ARENA_TITLE.EX_CHAMPION_COOLDOWN_WEEKS).toBeGreaterThan(
      ARENA_TITLE.CHALLENGER_COOLDOWN_WEEKS
    );
  });

  it('champions tournament occupies the last week of the year', () => {
    expect(CHAMPIONS_TOURNEY.WEEK).toBe(52);
    expect(CHAMPIONS_TOURNEY.MIN_FIELD).toBeGreaterThan(1);
  });
});
