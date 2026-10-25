/**
 * Shared tournament test fixtures — base GameState, warriors, completed brackets.
 * Extracted from awardsTokens.test.ts / tournamentSelection.test.ts (identical copies).
 * Bracket/outcome/state composers added when tournamentSelection.test.ts was
 * split into the tournamentSelection/ spec dir — one home for every repeated
 * setup (R1 brackets, alternating fields, open/finals entries, podium state).
 */
import type {
  GameState,
  RivalStableData,
  TournamentEntry,
  TournamentBout,
  Warrior,
} from '@/types/state.types';
import type { FightOutcome, FightOutcomeBy } from '@/types/combat.types';
import type { OwnerPersonality } from '@/types/state/owner';
import {
  FightingStyle,
  type WarriorId,
  type StableId,
  type TournamentId,
} from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { makeGameState as fixtureGameState } from '@/test/_fixtures/factories';

export const TOURNEY_PLAYER_ID = 'stable-player' as StableId;
export const TOURNEY_RIVAL_ID = 'stable-rival-1' as StableId;

/** The rival-stable literal shared by tournament tests. */
export const makeTournamentRival = (roster: Warrior[] = []): RivalStableData =>
  ({
    id: TOURNEY_RIVAL_ID,
    owner: {
      id: TOURNEY_RIVAL_ID,
      name: 'Rival',
      stableName: 'Rival Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    roster,
    treasury: 500,
    fame: 0,
  }) as RivalStableData;

/** Builds a minimal tournament-ready GameState fixture for the given week. */
export const makeTournamentBaseState = (week = 1): GameState =>
  fixtureGameState({
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    player: {
      id: TOURNEY_PLAYER_ID,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    week,
    year: 1,
    treasury: 1000,
    fame: 0,
    popularity: 0,
    roster: [],
    rivals: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    retired: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    tournaments: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    playerStableAvoids: [],
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    isFTUE: false,
  });

/** Creates a tournament fixture warrior on the given stable's roster. */
export function makeTournamentWarrior(
  id: string,
  name: string,
  style: FightingStyle = FightingStyle.StrikingAttack,
  stableId: StableId = TOURNEY_PLAYER_ID,
  overrides: Partial<Warrior> = {}
): Warrior {
  return makeWarrior({
    id: id as WarriorId,
    name: name,
    style: style,
    attrs: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    overrides: { stableId, ...overrides },
  });
}

/**
 * Bare TournamentEntry — the "t1 / Spring / week-5" literal cloned across the
 * tournament component and page specs. `over` permits extra render-time keys
 * (seasonName/winner) several components read off the loosened entry shape.
 */
export function makeTournament(
  over: Partial<TournamentEntry> & Record<string, unknown> = {}
): TournamentEntry {
  return {
    id: 't1' as TournamentId,
    season: 'Spring',
    week: 5,
    tierId: 'Gold',
    name: 'Spring Classic',
    bracket: [],
    participants: [],
    completed: false,
    ...over,
  };
}

/** Builds a completed tournament bracket fixture with winners decided. */
export function makeCompletedTournament(
  warriors: Warrior[],
  winnerFirst: 'A' | 'D' = 'A',
  winnerThird: 'A' | 'D' = 'A',
  tierId = 'Gold',
  tournamentId = 't-gold-spring-1'
): TournamentEntry {
  const wA = warriors[0]!;
  const wB = warriors[1]!;
  const wC = warriors[2]!;
  const wD = warriors[3]!;

  const bracket: TournamentBout[] = [
    {
      round: 6,
      matchIndex: 0,
      warriorIdA: wA.id,
      warriorIdD: wB.id,
      stableIdA: wA.stableId,
      stableIdD: wB.stableId,
      winner: winnerFirst,
      by: 'Stoppage',
    },
    {
      round: 6,
      matchIndex: 1,
      warriorIdA: wC.id,
      warriorIdD: wD.id,
      stableIdA: wC.stableId,
      stableIdD: wD.stableId,
      winner: winnerThird,
      by: 'Stoppage',
    },
  ];

  return {
    id: tournamentId as TournamentId,
    season: 'Spring',
    week: 1,
    tierId,
    name: 'Imperial Gold Cup',
    bracket,
    participants: warriors,
    completed: true,
    champion: winnerFirst === 'A' ? wA.name : wB.name,
  };
}

/** Minimal FightOutcome fixture — the shape applyBoutResults consumes. */
export function makeFightOutcome(winner: 'A' | 'D', by: FightOutcomeBy = 'Stoppage'): FightOutcome {
  return {
    winner,
    by,
    minutes: 1,
    log: [],
    exchangeLog: [],
    post: { tags: [] } as any,
  } as FightOutcome;
}

/** Tournament with a single unresolved round-1 bracket pairing warriors in order. */
export function makeTournamentWithR1(warriors: Warrior[]): TournamentEntry {
  const bracket: TournamentBout[] = [];
  for (let i = 0; i < warriors.length; i += 2) {
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      warriorIdA: warriors[i]!.id,
      warriorIdD: warriors[i + 1]!.id,
      stableIdA: warriors[i]!.stableId,
      stableIdD: warriors[i + 1]!.stableId,
    });
  }
  return {
    id: 't-gold-spring-1' as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name: 'Imperial Gold Cup',
    bracket,
    participants: warriors,
    completed: false,
  };
}

/**
 * Field of `count` StrikingAttack warriors alternating player/rival stables by
 * bracket slot. With the default `aSide: 'player'`, slot-A warriors (even
 * indices) belong to the player — so a winner-'A' fight stub crowns the player
 * side. `aSide: 'rival'` flips every stable so 'A' winners are NPCs.
 */
export function makeAlternatingField(
  count: number,
  opts: { idPrefix?: string; namePrefix?: string; aSide?: 'player' | 'rival' } = {}
): Warrior[] {
  const { idPrefix = 'w', namePrefix = 'Warrior', aSide = 'player' } = opts;
  const ws: Warrior[] = [];
  for (let i = 0; i < count; i++) {
    const isSlotA = i % 2 === 0;
    const stableId = isSlotA === (aSide === 'player') ? TOURNEY_PLAYER_ID : TOURNEY_RIVAL_ID;
    ws.push(
      makeTournamentWarrior(
        `${idPrefix}${i}`,
        `${namePrefix} ${i}`,
        FightingStyle.StrikingAttack,
        stableId
      )
    );
  }
  return ws;
}

/**
 * Week-1 state with warriors split onto rosters by stableId — player stable on
 * `roster`, rivals inside `makeTournamentRival` — and the round-1 tournament
 * attached (pass `withTournament: false` to attach a custom bracket instead).
 */
export function makeSplitTournamentState(
  warriors: Warrior[],
  opts: { withTournament?: boolean } = {}
): GameState {
  const { withTournament = true } = opts;
  const state = makeTournamentBaseState(1);
  state.roster = warriors.filter((w) => w.stableId === TOURNEY_PLAYER_ID);
  state.rivals = [makeTournamentRival(warriors.filter((w) => w.stableId === TOURNEY_RIVAL_ID))];
  if (withTournament) state.tournaments = [makeTournamentWithR1(warriors)];
  return state;
}

/** Unfinished tournament holding a single unresolved round-1 bout between a and d. */
export function makeOpenTournament(
  id: string,
  name: string,
  a: Warrior,
  d: Warrior
): TournamentEntry {
  return {
    id: id as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name,
    bracket: [
      {
        round: 1,
        matchIndex: 0,
        warriorIdA: a.id,
        warriorIdD: d.id,
        stableIdA: a.stableId,
        stableIdD: d.stableId,
      },
    ],
    participants: [a, d],
    completed: false,
  };
}

/**
 * Unfinished tournament reduced to the round-7 championship bout — the shape
 * isComplete (currentRound >= 7) needs to seal completion in one resolution.
 */
export function makeFinalsTournament(w1: Warrior, w2: Warrior): TournamentEntry {
  return {
    id: 't-gold-spring-1' as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name: 'Imperial Gold Cup',
    bracket: [
      {
        round: 7,
        matchIndex: 0,
        warriorIdA: w1.id,
        warriorIdD: w2.id,
        stableIdA: w1.stableId,
        stableIdD: w2.stableId,
      },
    ],
    participants: [w1, w2],
    completed: false,
  };
}

/**
 * Player-vs-rival state with a finals-bout tournament attached — the shared
 * completion spec setup (one w1 on the player roster, one w2 on the rival's).
 */
export function makeFinalsState(
  w1: Warrior,
  w2: Warrior
): { state: GameState; tournament: TournamentEntry } {
  const state = makeTournamentBaseState(1);
  state.roster = [w1];
  state.rivals = [makeTournamentRival([w2])];
  const tournament = makeFinalsTournament(w1, w2);
  state.tournaments = [tournament];
  return { state, tournament };
}

/**
 * The canonical 4-man podium setup shared by prize-award specs: Champ on the
 * player roster, Runner/Bronzer/Fourth on the rival, plus the completed
 * bracket whose finalists/bronze outcomes are set by winnerFirst/winnerThird.
 */
export function makeFourManPodium(
  opts: { winnerFirst?: 'A' | 'D'; winnerThird?: 'A' | 'D' } = {}
): {
  warriors: [Warrior, Warrior, Warrior, Warrior];
  state: GameState;
  tournament: TournamentEntry;
} {
  const w1 = makeTournamentWarrior('w1', 'Champ', FightingStyle.StrikingAttack, TOURNEY_PLAYER_ID);
  const w2 = makeTournamentWarrior('w2', 'Runner', FightingStyle.StrikingAttack, TOURNEY_RIVAL_ID);
  const w3 = makeTournamentWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, TOURNEY_RIVAL_ID);
  const w4 = makeTournamentWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, TOURNEY_RIVAL_ID);

  const state = makeTournamentBaseState(1);
  state.roster = [w1];
  state.rivals = [makeTournamentRival([w2, w3, w4])];

  const tournament = makeCompletedTournament(
    [w1, w2, w3, w4],
    opts.winnerFirst ?? 'A',
    opts.winnerThird ?? 'A'
  );

  return { warriors: [w1, w2, w3, w4], state, tournament };
}

/**
 * rivalMap entry literal used by getAIPlan specs — same shape as
 * makeTournamentRival plus an optional owner personality / custom owner id.
 */
export function rivalMapEntry(
  opts: { ownerId?: string; personality?: OwnerPersonality } = {}
): RivalStableData {
  return {
    id: TOURNEY_RIVAL_ID,
    owner: {
      id: (opts.ownerId ?? TOURNEY_RIVAL_ID) as RivalStableData['owner']['id'],
      name: 'Rival',
      stableName: 'Rival Stable',
      fame: 0,
      renown: 0,
      titles: 0,
      ...(opts.personality ? { personality: opts.personality } : {}),
    },
    roster: [],
    treasury: 500,
    fame: 0,
    ledger: [],
    trainingAssignments: [],
  } as RivalStableData;
}
