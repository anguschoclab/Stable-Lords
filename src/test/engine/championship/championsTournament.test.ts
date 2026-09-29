// @vitest-environment node
/**
 * Grand Championship — the annual champions-only tournament (week 52) and
 * the calendar migration around it (seasonals at weeks 10/20/30/42).
 */
import { describe, it, expect } from 'vitest';
import { createChampionshipDelta } from '@/engine/championship/arenaChampionship';
import {
  recordGrandChampions,
  selectGrandChampionshipField,
} from '@/engine/championship/championsTournament';
import { runRivalStrategyPass } from '@/engine/pipeline/passes/RivalStrategyPass';
import { runArenaChampionshipPass } from '@/engine/pipeline/passes/ArenaChampionshipPass';
import { resolveImpacts } from '@/engine/impacts';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { resolveCompleteTournament } from '@/engine/matchmaking/tournamentSelection/resolution';
import { CHAMPIONS_TOURNEY } from '@/constants/arena/arenaChampionship';
import { EPITHET_TABLES } from '@/data/names/epithets';
import { SEASONAL_TOURNAMENT_WEEKS, LEGACY_TOURNAMENT_WEEKS } from '@/constants/core/dates';
import {
  makeGameState,
  makeWarrior,
  makeRival,
} from '@/test/_fixtures/factories';
import type { ArenaTitle, GameState, TournamentEntry, Warrior } from '@/types/state.types';
import type { WarriorId, StableId, TournamentId } from '@/types/shared.types';

// ─── Builders ───────────────────────────────────────────────────────────────

function title(partial: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: null,
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...partial,
  };
}

function champ(id: string, opts: Partial<Warrior> = {}): Warrior {
  return makeWarrior({ id: id as WarriorId, name: `Champ ${id}`, fame: 0, popularity: 0, ...opts });
}

/** Seed `n` arena titles crowned by warriors placed across rosters. */
function crownedState(n: number, opts: { rivalChamps?: number } = {}): GameState {
  const arenas = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'];
  const rivalCount = opts.rivalChamps ?? 0;
  const playerIds: string[] = [];
  const rivalIds: string[] = [];
  for (let i = 0; i < n; i++) {
    (i < n - rivalCount ? playerIds : rivalIds).push(`w${i}`);
  }
  const arenaChampions: Record<string, ArenaTitle> = {};
  [...playerIds, ...rivalIds].forEach((id, i) => {
    arenaChampions[arenas[i]!] = title({
      champion: { warriorId: id as WarriorId, startedAbsoluteWeek: 1, defenses: 0, lastActivityWeek: 1 },
    });
  });
  return makeGameState({
    week: 51,
    arenaChampions,
    roster: playerIds.map((id) => champ(id)),
    rivals: rivalIds.length
      ? [makeRival({ id: 'r1' as StableId, roster: rivalIds.map((id) => champ(id)) })]
      : [],
  });
}

/** A completed Champions-tier tournament crowned by `winnerId`. */
function championsTournament(winnerId: string, opts: Partial<TournamentEntry> = {}): TournamentEntry {
  return {
    id: 't-champions-winter-y1-w52' as TournamentId,
    season: 'Winter',
    week: 52,
    tierId: CHAMPIONS_TOURNEY.TIER_ID,
    name: CHAMPIONS_TOURNEY.NAME,
    participants: [],
    completed: true,
    champion: `Champ ${winnerId}`,
    bracket: [
      {
        round: 1,
        matchIndex: 0,
        warriorIdA: winnerId as WarriorId,
        warriorIdD: 'other' as WarriorId,
        winner: 'A',
      },
    ],
    ...opts,
  };
}

// ─── Field selection ────────────────────────────────────────────────────────

describe('selectGrandChampionshipField', () => {
  it('gathers every living reigning champion across arenas', () => {
    const state = crownedState(5);
    const field = selectGrandChampionshipField(state);
    expect(field.map((w) => w.id)).toEqual(['w0', 'w1', 'w2', 'w3', 'w4']);
  });

  it('excludes dead/retired champions and empty titles', () => {
    const state = crownedState(5);
    state.arenaChampions!['a1']!.champion = null; // a1 (w0) vacant — not eligible
    state.roster[2] = makeWarrior({ id: 'w2' as WarriorId, status: 'Dead' });
    const field = selectGrandChampionshipField(state);
    expect(field.map((w) => w.id)).toEqual(['w1', 'w3', 'w4']);
  });

  it('is deterministic for a given state', () => {
    const state = crownedState(6);
    expect(selectGrandChampionshipField(state).map((w) => w.id)).toEqual(
      selectGrandChampionshipField(state).map((w) => w.id)
    );
  });
});

// ─── Award recording ────────────────────────────────────────────────────────

describe('recordGrandChampions', () => {
  it('records the winner and awards purse, fame, popularity, and title (player)', () => {
    const state = crownedState(5);
    state.tournaments = [championsTournament('w2')];
    const delta = createChampionshipDelta();
    recordGrandChampions(state, delta);

    expect(delta.grandChampions).toHaveLength(1);
    const entry = delta.grandChampions[0]!;
    expect(entry.warriorId).toBe('w2');
    expect(entry.warriorName).toBe('Champ w2');
    expect(entry.year).toBe(1);

    const upd = delta.rosterUpdates.get('w2' as WarriorId)!;
    expect(upd.fame).toBe(CHAMPIONS_TOURNEY.WINNER_FAME);
    expect(upd.popularity).toBe(CHAMPIONS_TOURNEY.WINNER_POP);
    expect(upd.titles).toContain(CHAMPIONS_TOURNEY.TITLE);
    expect(upd.champion).toBe(true);
    expect(delta.treasuryDelta).toBe(CHAMPIONS_TOURNEY.PURSE);
  });

  it('awards rival winners through rivalsUpdates', () => {
    const state = crownedState(5, { rivalChamps: 1 }); // w4 is a rival's champ
    state.tournaments = [championsTournament('w4')];
    const delta = createChampionshipDelta();
    recordGrandChampions(state, delta);

    const upd = delta.rivalsUpdates.get('r1' as StableId)!;
    expect(upd.treasury).toBe(1000 + CHAMPIONS_TOURNEY.PURSE);
    const w4 = (upd.roster ?? []).find((w) => w.id === 'w4')!;
    expect(w4.fame).toBe(CHAMPIONS_TOURNEY.WINNER_FAME);
    expect(w4.champion).toBe(true);
    expect(delta.rosterUpdates.size).toBe(0);
    expect(delta.treasuryDelta ?? 0).toBe(0);
  });

  it('ignores non-Champions, incomplete, and already-recorded tournaments', () => {
    const state = crownedState(5);
    state.tournaments = [
      championsTournament('w0', { tierId: 'Gold' }),
      championsTournament('w1', { id: 't-champions-other-y1-w52' as TournamentId, completed: false }),
      championsTournament('w2', { id: 't-champions-winter-y1-w52' as TournamentId }),
    ];
    state.grandChampions = [
      {
        tournamentId: 't-champions-winter-y1-w52' as TournamentId,
        year: 1,
        warriorId: 'w2' as WarriorId,
        warriorName: 'Champ w2',
      },
    ];
    const delta = createChampionshipDelta();
    recordGrandChampions(state, delta);
    expect(delta.grandChampions).toHaveLength(0);
  });

  it('awards a grand_champion epithet to a player winner', () => {
    const state = crownedState(5);
    state.tournaments = [championsTournament('w2')];
    const delta = createChampionshipDelta();
    recordGrandChampions(state, delta);
    const epithet = delta.warriorEpithets['w2' as WarriorId];
    expect(epithet).toBeDefined();
    expect(EPITHET_TABLES.grand_champion).toContain(epithet);
    expect(delta.rosterUpdates.get('w2' as WarriorId)?.name).toBeUndefined(); // canonical name never rewritten
  });

  it('awards a grand_champion epithet to a rival winner', () => {
    const state = crownedState(5, { rivalChamps: 1 });
    state.tournaments = [championsTournament('w4')];
    const delta = createChampionshipDelta();
    recordGrandChampions(state, delta);
    const epithet = delta.warriorEpithets['w4' as WarriorId];
    expect(EPITHET_TABLES.grand_champion).toContain(epithet);
    const w4 = state.rivals[0]!.roster.find((w) => w.id === 'w4')!;
    expect(w4.name).toBe('Champ w4'); // unchanged
  });
});

// ─── Calendar emission ──────────────────────────────────────────────────────

describe('seasonal tournament calendar', () => {
  it.each(SEASONAL_TOURNAMENT_WEEKS)('emits seasonal tournaments on week %i', (week) => {
    const state = makeGameState({ week, rivals: [makeRival()] });
    const impact = runRivalStrategyPass(state, week, undefined, true) as {
      tournaments?: TournamentEntry[];
      isTournamentWeek?: boolean;
    };
    const tournaments = impact.tournaments ?? [];
    expect(tournaments.length).toBeGreaterThan(0);
    expect((impact as { isTournamentWeek?: boolean }).isTournamentWeek).toBe(true);
  });

  it.each([13, 26, 39])('emits nothing on legacy week %i (calendar moved)', (week) => {
    const state = makeGameState({ week, rivals: [makeRival()] });
    const impact = runRivalStrategyPass(state, week, undefined, true) as {
      tournaments?: TournamentEntry[];
      isTournamentWeek?: boolean;
    };
    expect(impact.tournaments ?? []).toHaveLength(0);
    expect(impact.isTournamentWeek).not.toBe(true);
  });

  it('week 52 emits only the champions bracket — no seasonal tiers', () => {
    const state = crownedState(6);
    const impact = runRivalStrategyPass(state, 52, undefined, true) as {
      tournaments?: TournamentEntry[];
      isTournamentWeek?: boolean;
    };
    const tournaments = impact.tournaments ?? [];
    expect(tournaments).toHaveLength(1);
    expect(tournaments[0]!.tierId).toBe(CHAMPIONS_TOURNEY.TIER_ID);
    expect(tournaments[0]!.name).toBe(CHAMPIONS_TOURNEY.NAME);
    // champions-only field: every participant is a reigning champion
    const champIds = new Set(
      Object.values(state.arenaChampions ?? {}).map((t) => t.champion?.warriorId)
    );
    for (const p of tournaments[0]!.participants) expect(champIds.has(p.id)).toBe(true);
    expect(impact.isTournamentWeek).toBe(true);
  });

  it('week 52 with fewer than MIN_FIELD champions runs no tournament', () => {
    const state = crownedState(CHAMPIONS_TOURNEY.MIN_FIELD - 1);
    const impact = runRivalStrategyPass(state, 52, undefined, true) as {
      tournaments?: TournamentEntry[];
      isTournamentWeek?: boolean;
    };
    expect(impact.tournaments ?? []).toHaveLength(0);
    expect(impact.isTournamentWeek).not.toBe(true);
  });

  it('reigning champions remain conscriptable into seasonal brackets', () => {
    // The booking lock governs bout *offers* only — committeeSelection pools
    // ranked warriors with no champion exclusion, so crowns fight seasonals.
    const state = crownedState(6);
    state.realmRankings = {};
    state.roster.forEach((w, i) => {
      state.realmRankings[w.id] = { overallRank: i + 1, classRank: 1, compositeScore: 100 - i };
    });
    const tournaments = TournamentSelectionService.generateSeasonalTiers(
      state,
      10,
      state.season,
      42
    );
    expect(tournaments.length).toBeGreaterThan(0);
    const field = new Set(tournaments.flatMap((t) => t.participants.map((p) => p.id)));
    for (const w of state.roster) {
      expect(field.has(w.id), `champion ${w.id} missing from seasonal field`).toBe(true);
    }
  });
});

// ─── Pass integration ───────────────────────────────────────────────────────

describe('ArenaChampionshipPass grand-champion wiring', () => {
  it('records a just-completed Grand Championship through the pass impact', () => {
    const state = crownedState(5);
    state.tournaments = [championsTournament('w1')];
    const impact = runArenaChampionshipPass(state, {
      currentWeek: 52,
      nextWeek: 1,
      nextYear: 2,
      rootRng: { next: () => 0.5, uuid: () => 'x' } as never,
    });
    expect(impact.grandChampions).toHaveLength(1);
    expect(impact.grandChampions![0]!.warriorId).toBe('w1');
    expect(impact.treasuryDelta).toBe(CHAMPIONS_TOURNEY.PURSE);

    const treasuryBefore = state.treasury;
    const next = resolveImpacts(state, [impact]);
    expect(next.grandChampions).toHaveLength(1);
    expect(next.treasury).toBe(treasuryBefore + CHAMPIONS_TOURNEY.PURSE);
  });
});

// ─── Migration ──────────────────────────────────────────────────────────────

describe('calendar migration', () => {
  it('an unfinished legacy-cadence tournament still resolves at the week boundary', () => {
    const state = makeGameState({ week: 13,});
    const old: TournamentEntry = {
      id: 't-gold-spring-y1-w13' as TournamentId,
      season: 'Spring',
      week: 13,
      tierId: 'Gold',
      name: 'Legacy Bracket',
      participants: [champ('a'), champ('b')],
      completed: false,
      bracket: [
        {
          round: 1,
          matchIndex: 0,
          warriorIdA: 'a' as WarriorId,
          warriorIdD: 'b' as WarriorId,
        },
      ],
    };
    state.tournaments = [old];
    state.roster = [champ('a'), champ('b')];
    const resolved = resolveCompleteTournament(state, old.id, 1337, true);
    const after = resolved.tournaments!.find((t) => t.id === old.id)!;
    expect(after.completed).toBe(true);
    expect(after.champion).toBeDefined();
  });

  it('legacy weeks absent from the new calendar produce no catch-up tournament', () => {
    // A save at week 11 already passed new week-10 and misses old week-13.
    // Accepted loss — asserted so the behavior is deliberate, not silent.
    for (const legacyWeek of LEGACY_TOURNAMENT_WEEKS.filter((w) => w !== 52)) {
      const state = makeGameState({ week: legacyWeek, rivals: [makeRival()] });
      const impact = runRivalStrategyPass(state, legacyWeek, undefined, true) as {
        tournaments?: TournamentEntry[];
      };
      expect(impact.tournaments ?? []).toHaveLength(0);
    }
  });
});
