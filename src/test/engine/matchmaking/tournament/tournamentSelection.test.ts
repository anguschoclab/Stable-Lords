import { describe, it, expect, vi } from 'vitest';
import type { GameState, TournamentEntry, TournamentBout, Warrior } from '@/types/state.types';
import type { FightOutcome, FightOutcomeBy } from '@/types/combat.types';
import {
  FightingStyle,
  type WarriorId,
  type StableId,
  type TournamentId,
} from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNG } from '@/utils/random';
import { getPairKey } from '@/utils/keyUtils';
// ─── Mock simulateFight before importing resolution ───
vi.mock('@/engine/simulate', () => ({
  simulateFight: vi.fn(() => ({
    winner: 'A',
    by: 'Stoppage',
    minutes: 1,
    log: [],
    exchangeLog: [],
    post: { tags: [] },
  })),
  defaultPlanForWarrior: vi.fn((w: Warrior) => ({
    killDesire: 5,
    weapon: 'Broadsword',
    planStyle: w.style,
  })),
}));

vi.mock('@/engine', () => ({
  aiPlanForWarrior: vi.fn((w: Warrior) => ({
    killDesire: 7,
    weapon: 'Broadsword',
    planStyle: w.style,
  })),
}));

vi.mock('@/engine/tokens/patronTokenService', () => ({
  PatronTokenService: {
    awardToken: vi.fn((state: GameState) => state),
  },
}));

// Import functions under test AFTER mocks are declared
import {
  awardTournamentPrizes,
  modifyWarrior,
} from '@/engine/matchmaking/tournamentSelection/awards';
import {
  resolveRound,
  resolveCompleteTournament,
  applyBoutResults,
} from '@/engine/matchmaking/tournamentSelection/resolution';
import { getAIPlan, generateFreelancer } from '@/engine/matchmaking/tournamentSelection/utils';

// ─── Helpers ───

const PLAYER_ID = 'stable-player' as StableId;
const RIVAL_ID = 'stable-rival-1' as StableId;

function makeBaseState(): GameState {
  return {
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    player: {
      id: PLAYER_ID,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    week: 1,
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
    unacknowledgedDeaths: [],
    crowdMood: 'Calm',
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    ledger: [],
    rosterBonus: 0,
    ftueComplete: true,
    ftueStep: 0,
    coachDismissed: [],
    rivalMap: new Map(),
    warriorMap: new Map(),
  } as unknown as GameState;
}

function makeTestWarrior(
  id: string,
  name: string,
  style: FightingStyle = FightingStyle.StrikingAttack,
  stableId: StableId = PLAYER_ID,
  overrides: Partial<Warrior> = {}
): Warrior {
  return makeWarrior(
    id as WarriorId,
    name,
    style,
    { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    { stableId, ...overrides }
  );
}

function makeFightOutcome(winner: 'A' | 'D', by: FightOutcomeBy = 'Stoppage'): FightOutcome {
  return {
    winner,
    by,
    minutes: 1,
    log: [],
    exchangeLog: [],
    post: { tags: [] } as any,
  } as FightOutcome;
}

function makeCompletedTournament(
  warriors: Warrior[],
  winnerFirst: 'A' | 'D' = 'A',
  winnerThird: 'A' | 'D' = 'A'
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
    id: 't-gold-spring-1' as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name: 'Imperial Gold Cup',
    bracket,
    participants: warriors,
    completed: true,
    champion: winnerFirst === 'A' ? wA.name : wB.name,
  };
}

function makeTournamentWithR1(warriors: Warrior[]): TournamentEntry {
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

// ─── awardTournamentPrizes ───

describe('awardTournamentPrizes', () => {
  it('awards medals to 1st, 2nd, and 3rd place warriors', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'A');
    const updated = awardTournamentPrizes(tournament, state);

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedRival = updated.rivals[0]!;
    const updatedW2 = updatedRival.roster.find((w: Warrior) => w.id === 'w2')!;
    const updatedW3 = updatedRival.roster.find((w: Warrior) => w.id === 'w3')!;

    expect(updatedW1!.career.medals!.gold).toBe(1);
    expect(updatedW2!.career.medals!.silver).toBe(1);
    expect(updatedW3!.career.medals!.bronze).toBe(1);
  });

  it('awards correct fame amounts', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4], 'A', 'D');
    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.roster[0]!.fame).toBe(100);
    expect(updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2')!.fame).toBe(50);
    expect(updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w4')!.fame).toBe(25);
  });

  it('awards treasury and creates ledger entry for player', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.treasury = 1000;
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4]);
    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.treasury).toBe(6000);
    expect(updated.ledger.length).toBeGreaterThanOrEqual(1);
    expect(updated.ledger[0]!.category).toBe('prize');
  });

  it('grants roster bonus for 1st place', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4]);
    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.rosterBonus).toBe(1);
  });

  it('derives correct tier and purse from tournament data', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.treasury = 0;
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4]);
    tournament.tierId = 'Silver';
    tournament.name = 'Proconsul Silver Plate';

    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.treasury).toBe(2500);
  });

  it('handles missing bronze match (only 1st and 2nd awarded)', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    tournament.bracket = tournament.bracket.filter((b) => b.matchIndex !== 1);

    const updated = awardTournamentPrizes(tournament, state);

    expect(updated.roster[0]!.career.medals!.gold).toBe(1);
    expect(
      updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2')!.career.medals!.silver
    ).toBe(1);
  });

  it('updates rival stable treasury and fame', () => {
    const w1 = makeTestWarrior('w1', 'Champ', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'Runner', FightingStyle.StrikingAttack, RIVAL_ID);
    const w3 = makeTestWarrior('w3', 'Bronzer', FightingStyle.StrikingAttack, RIVAL_ID);
    const w4 = makeTestWarrior('w4', 'Fourth', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2, w3, w4],
        treasury: 500,
        fame: 10,
      } as any,
    ];

    const tournament = makeCompletedTournament([w1, w2, w3, w4]);
    const updated = awardTournamentPrizes(tournament, state);

    // 500 initial + 2500 (2nd) + 1250 (3rd) = 4250
    expect(updated.rivals[0]!.treasury).toBe(4250);
    // 10 initial + 50 (2nd) + 25 (3rd) = 85
    expect(updated.rivals[0]!.fame).toBe(85);
  });
});

// ─── modifyWarrior (awards.ts) ───

describe('modifyWarrior (awards.ts)', () => {
  it('updates warrior in player roster', () => {
    const w = makeTestWarrior('w1', 'PlayerWarrior', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeBaseState();
    state.roster = [w];

    const updated = modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 999;
    });

    expect(updated.roster[0]!.fame).toBe(999);
  });

  it('updates warrior in rival roster', () => {
    const w = makeTestWarrior('w1', 'RivalWarrior', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeBaseState();
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const updated = modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 888;
    });

    expect(updated.rivals[0]!.roster[0]!.fame).toBe(888);
  });

  it('does not mutate original state', () => {
    const w = makeTestWarrior('w1', 'PlayerWarrior', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeBaseState();
    state.roster = [w];

    modifyWarrior(state, 'w1', (draft) => {
      draft.fame = 999;
    });

    expect(state.roster[0]!.fame).toBe(0);
  });
});

// ─── resolveRound ───

describe('resolveRound (tournamentSelection/resolution.ts)', () => {
  it('returns empty results for missing tournament', () => {
    const state = makeBaseState();
    const { updatedState, roundResults } = resolveRound(state, 'nonexistent', 1);
    expect(updatedState).toEqual(state);
    expect(roundResults).toEqual([]);
  });

  it('returns empty results for completed tournament', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    state.tournaments = [tournament];

    const { updatedState, roundResults } = resolveRound(state, tournament.id, 1);
    expect(roundResults).toEqual([]);
    expect(updatedState.tournaments[0]!.completed).toBe(true);
  });

  it('resolves round 1 bouts and advances winners', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 4; i++) {
      warriors.push(
        makeTestWarrior(
          `w${i}`,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const state = makeBaseState();
    state.roster = warriors.filter((_, i) => i % 2 === 0);
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: warriors.filter((_, i) => i % 2 === 1),
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeTournamentWithR1(warriors);
    state.tournaments = [tournament];

    const { updatedState } = resolveRound(state, tournament.id, 1);

    const r1Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 1
    );
    expect(r1Bouts.every((b: TournamentBout) => b.winner !== undefined)).toBe(true);

    const r2Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 2
    );
    expect(r2Bouts.length).toBe(1);
  });

  it('handles bye matches', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 6; i++) {
      warriors.push(
        makeTestWarrior(
          `w${i}`,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const state = makeBaseState();
    state.roster = warriors.filter((_, i) => i % 2 === 0);
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: warriors.filter((_, i) => i % 2 === 1),
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeTournamentWithR1(warriors);
    state.tournaments = [tournament];

    // Resolve round 1 (3 bouts, 3 winners)
    const { updatedState } = resolveRound(state, tournament.id, 1);

    // After round 1, round 2 should be generated with 1 bout + 1 bye
    const r2Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 2
    );
    expect(r2Bouts.length).toBe(2);

    // Now resolve round 2 which contains the bye
    const { updatedState: finalState } = resolveRound(updatedState, tournament.id, 2);

    const byeBout = finalState.tournaments[0]!.bracket.find(
      (b: TournamentBout) => b.round === 2 && b.warriorIdD === 'bye'
    );
    expect(byeBout).toBeDefined();
    expect(byeBout!.winner).toBe('A');
  });

  it('handles missing warrior by auto-advancing the opponent', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);

    const state = makeBaseState();
    state.roster = [w1];

    const tournament = makeTournamentWithR1([
      w1,
      { id: 'w2', name: 'B', stableId: RIVAL_ID } as Warrior,
    ]);
    state.tournaments = [tournament];

    const { updatedState } = resolveRound(state, tournament.id, 1);

    const bout = updatedState.tournaments[0]!.bracket[0]!;
    expect(bout.winner).toBe('A');
  });

  it('injects bronze match after semifinals (round 5)', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 8; i++) {
      warriors.push(
        makeTestWarrior(
          `w${i}`,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const state = makeBaseState();
    state.roster = warriors.filter((_, i) => i % 2 === 0);
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: warriors.filter((_, i) => i % 2 === 1),
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const bracket: TournamentBout[] = [
      {
        round: 5,
        matchIndex: 0,
        warriorIdA: warriors[0]!.id,
        warriorIdD: warriors[1]!.id,
        stableIdA: warriors[0]!.stableId,
        stableIdD: warriors[1]!.stableId,
      },
      {
        round: 5,
        matchIndex: 1,
        warriorIdA: warriors[2]!.id,
        warriorIdD: warriors[3]!.id,
        stableIdA: warriors[2]!.stableId,
        stableIdD: warriors[3]!.stableId,
      },
    ];

    const tournament: TournamentEntry = {
      id: 't-gold-spring-1' as TournamentId,
      season: 'Spring',
      week: 1,
      tierId: 'Gold',
      name: 'Imperial Gold Cup',
      bracket,
      participants: warriors,
      completed: false,
    };

    state.tournaments = [tournament];

    const { updatedState } = resolveRound(state, tournament.id, 1);

    const bronzeMatch = updatedState.tournaments[0]!.bracket.find(
      (b: TournamentBout) => b.round === 6 && b.matchIndex === 1
    );
    expect(bronzeMatch).toBeDefined();
    expect(bronzeMatch!.warriorIdA).toBeDefined();
    expect(bronzeMatch!.warriorIdD).toBeDefined();
  });

  it('marks tournament complete after finals and sets champion', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    // The code requires currentRound >= 7 for completion, so create a round-7 bout
    const tournament: TournamentEntry = {
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

    state.tournaments = [tournament];

    const { updatedState, roundResults } = resolveRound(state, tournament.id, 1);

    expect(updatedState.tournaments[0]!.completed).toBe(true);
    expect(updatedState.tournaments[0]!.champion).toBe(w1.name);
    expect(roundResults.length).toBeGreaterThan(0);
    expect(roundResults[0]).toContain('CHAMPION');
  });
});

// ─── resolveCompleteTournament ───

describe('resolveCompleteTournament', () => {
  it('resolves all rounds to completion', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    // Use a round-7 bout so isComplete (currentRound >= 7) triggers
    const tournament: TournamentEntry = {
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

    state.tournaments = [tournament];

    const updated = resolveCompleteTournament(state, tournament.id, 1);

    expect(updated.tournaments[0]!.completed).toBe(true);
    expect(updated.tournaments[0]!.champion).toBeDefined();
  });

  it('returns same state if tournament is already completed', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    state.tournaments = [tournament];

    const updated = resolveCompleteTournament(state, tournament.id, 1);

    expect(updated.tournaments[0]!.completed).toBe(true);
  });
});

// ─── applyBoutResults ───

describe('applyBoutResults', () => {
  it('creates fight summary and appends to arena history', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults(state, w1, w2, outcome, 't-gold-spring-1', 'Test Cup', rng);

    expect(updated.arenaHistory.length).toBeGreaterThan(0);
    expect(updated.arenaHistory[0]!.tournamentId).toBe('t-gold-spring-1');
  });

  it('updates fatigue for both warriors', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID, { fatigue: 0 });
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID, { fatigue: 0 });

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults(state, w1, w2, outcome, 't1', 'Test', rng);

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.fatigue).toBeGreaterThan(0);
    expect(updatedW2!.fatigue).toBeGreaterThan(0);
  });

  it('skips fatigue when isTournamentWeek is true', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID, { fatigue: 10 });
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID, { fatigue: 10 });

    const state = makeBaseState();
    state.isTournamentWeek = true;
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults(state, w1, w2, outcome, 't1', 'Test', rng);

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.fatigue).toBe(10);
    expect(updatedW2!.fatigue).toBe(10);
  });

  it('handles death by adding victim to graveyard and removing from rosters', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Kill');
    const updated = applyBoutResults(state, w1, w2, outcome, 't1', 'Test', rng);

    expect(updated.graveyard.length).toBe(1);
    expect(updated.graveyard[0]!.id).toBe('w2');
    expect(updated.graveyard[0]!.status).toBe('Dead');
    expect(updated.roster.some((w) => w.id === 'w2')).toBe(false);
    expect(updated.rivals[0]!.roster.some((w: Warrior) => w.id === 'w2')).toBe(false);
  });

  it('updates career stats for winner and loser', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults(state, w1, w2, outcome, 't1', 'Test', rng);

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.career.wins).toBe(1);
    expect(updatedW2!.career.losses).toBe(1);
  });
});

// ─── getAIPlan ───

describe('getAIPlan', () => {
  it('returns default plan with killDesire 7 for non-rival warrior', () => {
    const w = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const state = makeBaseState();

    const plan = getAIPlan(state, w);

    expect(plan).toBeDefined();
    expect(plan.killDesire).toBe(7);
  });

  it('uses rivalMap for rival lookup', () => {
    const w = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeBaseState();
    state.rivalMap = new Map([
      [
        RIVAL_ID,
        {
          id: RIVAL_ID,
          owner: {
            id: RIVAL_ID,
            name: 'Rival',
            stableName: 'Rival Stable',
            fame: 0,
            renown: 0,
            titles: 0,
            personality: 'Aggressive',
          },
          roster: [],
          treasury: 500,
          fame: 0,
        } as any,
      ],
    ]);

    const plan = getAIPlan(state, w);

    expect(plan).toBeDefined();
  });

  it('passes grudge intensity when owner grudge exists', () => {
    const w = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, RIVAL_ID);
    const state = makeBaseState();
    state.rivalMap = new Map([
      [
        RIVAL_ID,
        {
          id: RIVAL_ID,
          owner: {
            id: 'owner-rival',
            name: 'Rival',
            stableName: 'Rival Stable',
            fame: 0,
            renown: 0,
            titles: 0,
          },
          roster: [],
          treasury: 500,
          fame: 0,
        } as any,
      ],
    ]);
    const grudge = {
      id: 'g1' as any,
      ownerIdA: 'owner-rival' as any,
      ownerIdB: PLAYER_ID,
      intensity: 5,
      reason: 'test',
      startWeek: 1,
      lastEscalation: 1,
    };
    state.ownerGrudges = [grudge];
    state.grudgeMap = new Map([[getPairKey('owner-rival', PLAYER_ID), grudge]]);

    const plan = getAIPlan(state, w, FightingStyle.StrikingAttack, PLAYER_ID);

    expect(plan).toBeDefined();
  });
});

// ─── generateFreelancer ───

describe('generateFreelancer', () => {
  it('creates a valid warrior', () => {
    const rng = new SeededRNG(42);
    const freelancer = generateFreelancer('Gold', 0, rng);

    expect(freelancer.name).toBeDefined();
    expect(freelancer.style).toBeDefined();
    expect(Object.values(FightingStyle)).toContain(freelancer.style);
  });

  it('scales attributes by tier', () => {
    const rng1 = new SeededRNG(1);
    const rng2 = new SeededRNG(1);

    const gold = generateFreelancer('Gold', 0, rng1);
    const iron = generateFreelancer('Iron', 0, rng2);

    const goldTotal = Object.values(gold.attributes).reduce((a, b) => a + b, 0);
    const ironTotal = Object.values(iron.attributes).reduce((a, b) => a + b, 0);

    expect(goldTotal).toBeGreaterThan(ironTotal);
  });
});

// ─── resolveRound — tournament param and isComplete ───

describe('resolveRound — tournament param and isComplete (resolution.ts)', () => {
  it('accepts optional tournament param and uses it directly', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 4; i++) {
      warriors.push(
        makeTestWarrior(
          `w${i}`,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const state = makeBaseState();
    state.roster = warriors.filter((_, i) => i % 2 === 0);
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: warriors.filter((_, i) => i % 2 === 1),
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeTournamentWithR1(warriors);
    state.tournaments = [tournament];

    // Use fresh deep-copied brackets since resolveRound mutates bout objects in-place
    const state1 = {
      ...state,
      tournaments: [{ ...tournament, bracket: tournament.bracket.map((b) => ({ ...b })) }],
    };
    const state2 = {
      ...state,
      tournaments: [{ ...tournament, bracket: tournament.bracket.map((b) => ({ ...b })) }],
    };

    // Pass the tournament directly — should produce the same result
    const result1 = resolveRound(state1, tournament.id, 1, undefined, state1.tournaments[0]);
    const result2 = resolveRound(state2, tournament.id, 1);
    expect(result1.roundResults).toEqual(result2.roundResults);
    expect(result1.updatedState.tournaments[0]!.bracket).toEqual(
      result2.updatedState.tournaments[0]!.bracket
    );
  });

  it('returns isComplete flag in the result', () => {
    const warriors: Warrior[] = [];
    for (let i = 0; i < 4; i++) {
      warriors.push(
        makeTestWarrior(
          `w${i}`,
          `Warrior ${i}`,
          FightingStyle.StrikingAttack,
          i % 2 === 0 ? PLAYER_ID : RIVAL_ID
        )
      );
    }

    const state = makeBaseState();
    state.roster = warriors.filter((_, i) => i % 2 === 0);
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: warriors.filter((_, i) => i % 2 === 1),
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament = makeTournamentWithR1(warriors);
    state.tournaments = [tournament];

    // Round 1 of 7 — should not be complete
    const result = resolveRound(state, tournament.id, 1);
    expect(result).toHaveProperty('isComplete');
    expect(result.isComplete).toBe(false);
  });

  it('resolveCompleteTournament uses returned isComplete', () => {
    const w1 = makeTestWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTestWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeBaseState();
    state.roster = [w1];
    state.rivals = [
      {
        id: RIVAL_ID,
        owner: {
          id: RIVAL_ID,
          name: 'Rival',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        roster: [w2],
        treasury: 500,
        fame: 0,
      } as any,
    ];

    const tournament: TournamentEntry = {
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

    state.tournaments = [tournament];

    const updated = resolveCompleteTournament(state, tournament.id, 1);
    expect(updated.tournaments[0]!.completed).toBe(true);
    expect(updated.tournaments[0]!.champion).toBeDefined();
  });
});
