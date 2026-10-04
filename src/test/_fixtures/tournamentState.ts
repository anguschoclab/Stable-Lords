/**
 * Shared tournament test fixtures — base GameState, warriors, completed brackets.
 * Extracted from awardsTokens.test.ts / tournamentSelection.test.ts (identical copies).
 */
import type {
  GameState,
  RivalStableData,
  TournamentEntry,
  TournamentBout,
  Warrior,
} from '@/types/state.types';
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
  return makeWarrior(
    { id: id as WarriorId, name: name, style: style, attrs: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, overrides: { stableId, ...overrides } }
  );
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
