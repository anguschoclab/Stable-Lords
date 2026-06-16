import { describe, it, expect } from 'vitest';
import { resolveImpacts, type StateImpact } from '@/engine/impacts';
import type { GameState, Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';
import type {
  FightSummary,
  Trainer,
  RivalStableData,
  RestState,
  HallEntry,
  MatchRecord,
  ScoutReportData,
  InsightToken,
  AnnualAward,
  SeasonalGrowth,
  RankingEntry,
  Promoter,
  PoolWarrior,
  GazetteStory,
  OwnerGrudge,
  Rivalry,
  TrainingAssignment,
  BoutOffer,
  TournamentEntry,
} from '@/types/state.types';
import type { CrowdMoodType, WeatherType } from '@/types/shared.types';

function makeWarrior(id: string, name: string): Warrior {
  return {
    id: id as any,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
  };
}

function makeMinimalGameState(): GameState {
  return {
    treasury: 1000,
    fame: 50,
    week: 1,
    season: 'Spring',
    weather: 'Clear',
    day: 0,
    year: 1,
    roster: [makeWarrior('w1', 'Alice'), makeWarrior('w2', 'Bob')],
    rivals: [],
    newsletter: [],
    ledger: [],
    arenaHistory: [],
    graveyard: [],
    retired: [],
    hallOfFame: [],
    matchHistory: [],
    moodHistory: [],
    scoutReports: [],
    insightTokens: [],
    playerChallenges: [],
    playerAvoids: [],
    coachDismissed: [],
    restStates: [],
    unacknowledgedDeaths: [],
    awards: [],
    seasonalGrowth: [],
    recruitPool: [],
    tournaments: [],
    realmRankings: {},
    boutOffers: {},
    promoters: {},
    trainers: [],
    hiringPool: [],
    gazettes: [],
    ownerGrudges: [],
    rivalries: [],
    trainingAssignments: [],
    isTournamentWeek: false,
    activeTournamentId: undefined,
    crowdMood: 'Calm',
    lastSimulationReport: undefined,
  } as any;
}

function makeFightSummary(id: string = 'fight-1'): FightSummary {
  return {
    id: id as any,
    week: 1,
    warriorIdA: 'w1' as any,
    warriorIdD: 'w2' as any,
    stableIdA: 's-a' as any,
    stableIdD: 's-d' as any,
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.TotalParry,
    winner: 'A',
    by: 'KO',
    title: 'Test Fight',
    transcript: [],
    createdAt: new Date().toISOString(),
  };
}

function makeTrainer(id: string = 'trainer-1'): Trainer {
  return {
    id: id as any,
    name: 'Trainer One',
    tier: 'Novice',
    specialty: 'IronConditioning' as any,
    contractWeeksLeft: 10,
    age: 35,
    focus: 'Strength' as any,
    fame: 10,
  };
}

function makeRival(id: string = 'rival-1'): RivalStableData {
  return {
    id: id as any,
    fame: 50,
    owner: {
      id: 'owner-1' as any,
      name: 'Rival Owner',
      fame: 50,
      stableName: 'Rival Stable',
      renown: 5,
      titles: 0,
    },
    roster: [makeWarrior('r1', 'Rival1')],
    treasury: 1000,
    tier: 'Established' as any,
    ledger: [],
    trainingAssignments: [],
  };
}

function makeInitialState(): GameState {
  return makeMinimalGameState();
}

describe('resolveImpacts', () => {
  it('applies treasury and fame deltas correctly', () => {
    const state = makeInitialState();
    const impact: StateImpact = {
      treasuryDelta: 500,
      fameDelta: -10,
    };

    const newState = resolveImpacts(state, [impact]);

    expect(newState.treasury).toBe(1500);
    expect(newState.fame).toBe(40);
  });

  it('applies roster updates using ID mapping', () => {
    const state = makeInitialState();
    const rosterUpdates = new Map<any, Partial<Warrior>>();
    rosterUpdates.set('w1' as any, { fame: 100, age: 25 });

    const impact: StateImpact = { rosterUpdates };
    const newState = resolveImpacts(state, [impact]);

    const w1 = newState.roster.find((w) => w.id === 'w1');
    expect(w1?.fame).toBe(100);
    expect(w1?.age).toBe(25);

    // w2 should remain unchanged
    const w2 = newState.roster.find((w) => w.id === 'w2');
    expect(w2?.fame).toBe(0);
  });

  it('merges newsletter items and ledger entries', () => {
    const state = makeInitialState();
    const impact: StateImpact = {
      newsletterItems: [{ id: 'n1' as any, week: 1, title: 'T1', items: ['i1'] }],
      ledgerEntries: [{ id: 'l1' as any, week: 1, category: 'upkeep', amount: -50, label: 'L1' }],
    };

    const newState = resolveImpacts(state, [impact]);

    expect(newState.newsletter).toHaveLength(1);
    expect(newState.newsletter[0]?.title).toBe('T1');
    expect(newState.ledger).toHaveLength(1);
    expect(newState.ledger[0]?.amount).toBe(-50);
  });

  it('handles multiple impacts correctly', () => {
    const state = makeInitialState();
    const impact1: StateImpact = { treasuryDelta: 100 };
    const impact2: StateImpact = { treasuryDelta: 200 };

    const newState = resolveImpacts(state, [impact1, impact2]);

    expect(newState.treasury).toBe(1300);
  });

  // Phase 1: Array Append Handlers
  it('handles rosterRemovals - removes warriors by ID', () => {
    const state = makeInitialState();
    const impact: StateImpact = { rosterRemovals: ['w1' as any] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster).toHaveLength(1);
    expect(newState.roster[0]?.id).toBe('w2');
    expect(state.roster).toHaveLength(2); // Original state unchanged
  });

  it('handles rosterRemovals - empty array', () => {
    const state = makeInitialState();
    const impact: StateImpact = { rosterRemovals: [] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster).toHaveLength(2);
  });

  it('handles arenaHistory - appends fight summaries', () => {
    const state = makeInitialState();
    const impact: StateImpact = { arenaHistory: [makeFightSummary('f1')] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.arenaHistory).toHaveLength(1);
    expect(newState.arenaHistory[0]?.id).toBe('f1');
  });

  it('handles graveyard - appends dead warriors', () => {
    const state = makeInitialState();
    const deadWarrior = makeWarrior('w3', 'Dead');
    deadWarrior.status = 'Dead';
    const impact: StateImpact = { graveyard: [deadWarrior] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.graveyard).toHaveLength(1);
    expect(newState.graveyard[0]?.id).toBe('w3');
  });

  it('handles retired - appends retired warriors', () => {
    const state = makeInitialState();
    const retiredWarrior = makeWarrior('w3', 'Retired');
    retiredWarrior.status = 'Retired';
    const impact: StateImpact = { retired: [retiredWarrior] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.retired).toHaveLength(1);
    expect(newState.retired[0]?.id).toBe('w3');
  });

  it('handles restStates - appends rest state records', () => {
    const state = makeInitialState();
    const restState: RestState = { warriorId: 'w1' as any, restUntilWeek: 5 };
    const impact: StateImpact = { restStates: [restState] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.restStates).toHaveLength(1);
    expect(newState.restStates[0]?.warriorId).toBe('w1');
  });

  it('handles hallOfFame - appends hall entries', () => {
    const state = makeInitialState();
    const hallEntry: HallEntry = {
      id: 'h1' as any,
      week: 1,
      label: 'Fight of the Week',
      fightId: 'f1' as any,
    };
    const impact: StateImpact = { hallOfFame: [hallEntry] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.hallOfFame).toHaveLength(1);
    expect(newState.hallOfFame[0]?.id).toBe('h1');
  });

  it('handles matchHistory - appends match records', () => {
    const state = makeInitialState();
    const matchRecord: MatchRecord = {
      week: 1,
      playerWarriorId: 'w1' as any,
      opponentWarriorId: 'w2' as any,
      opponentStableId: 'rival-1' as any,
    };
    const impact: StateImpact = { matchHistory: [matchRecord] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.matchHistory).toHaveLength(1);
    expect(newState.matchHistory[0]?.playerWarriorId).toBe('w1');
  });

  it('handles moodHistory - appends mood snapshots', () => {
    const state = makeInitialState();
    const moodSnapshot = { week: 1, mood: 'Bloodthirsty' as CrowdMoodType };
    const impact: StateImpact = { moodHistory: [moodSnapshot] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.moodHistory).toHaveLength(1);
    expect(newState.moodHistory[0]?.mood).toBe('Bloodthirsty');
  });

  it('handles scoutReports - appends scout data', () => {
    const state = makeInitialState();
    const scoutReport: ScoutReportData = {
      id: 's1' as any,
      warriorName: 'Alice',
      style: 'Striking',
      quality: 'High' as any,
      week: 1,
      attributeRanges: {} as any,
      record: '0-0',
      knownInjuries: [],
      notes: 'Test',
    };
    const impact: StateImpact = { scoutReports: [scoutReport] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.scoutReports).toHaveLength(1);
    expect(newState.scoutReports[0]?.warriorName).toBe('Alice');
  });

  it('handles insightTokens - appends insight tokens', () => {
    const state = makeInitialState();
    const token: InsightToken = {
      id: 't1' as any,
      type: 'Weapon' as any,
      warriorId: 'w1' as any,
      warriorName: 'Alice',
      detail: 'Test',
      discoveredWeek: 1,
    };
    const impact: StateImpact = { insightTokens: [token] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.insightTokens).toHaveLength(1);
    expect(newState.insightTokens[0]?.id).toBe('t1');
  });

  it('handles playerChallenges - appends challenge IDs', () => {
    const state = makeInitialState();
    const impact: StateImpact = { playerChallenges: ['rival-1' as any] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.playerChallenges).toHaveLength(1);
    expect(newState.playerChallenges[0]).toBe('rival-1');
  });

  it('handles playerAvoids - appends avoid IDs', () => {
    const state = makeInitialState();
    const impact: StateImpact = { playerAvoids: ['rival-1' as any] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.playerAvoids).toHaveLength(1);
    expect(newState.playerAvoids[0]).toBe('rival-1');
  });

  it('handles coachDismissed - appends dismissed tip IDs', () => {
    const state = makeInitialState();
    const impact: StateImpact = { coachDismissed: ['tip-1'] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.coachDismissed).toHaveLength(1);
    expect(newState.coachDismissed[0]).toBe('tip-1');
  });

  it('handles unacknowledgedDeaths - appends death IDs', () => {
    const state = makeInitialState();
    const impact: StateImpact = { unacknowledgedDeaths: ['w1' as any] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.unacknowledgedDeaths).toHaveLength(1);
    expect(newState.unacknowledgedDeaths[0]).toBe('w1');
  });

  it('handles awards - appends annual awards', () => {
    const state = makeInitialState();
    const award: AnnualAward = {
      year: 1,
      type: 'Most Kills' as any,
      warriorId: 'w1' as any,
      warriorName: 'Alice',
      value: 10,
      reason: 'Test',
    };
    const impact: StateImpact = { awards: [award] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.awards).toHaveLength(1);
    expect(newState.awards[0]?.warriorId).toBe('w1');
  });

  // Phase 2: Replace Strategy Handlers
  it('handles seasonalGrowth - replaces entire growth array', () => {
    const state = makeInitialState();
    const growth: SeasonalGrowth = { warriorId: 'w1' as any, season: 'Spring', gains: { ST: 1 } };
    const impact: StateImpact = { seasonalGrowth: [growth] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.seasonalGrowth).toHaveLength(1);
    expect(newState.seasonalGrowth[0]?.warriorId).toBe('w1');
  });

  it('handles week - scalar replacement', () => {
    const state = makeInitialState();
    const impact: StateImpact = { week: 5 };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.week).toBe(5);
    expect(state.week).toBe(1); // Original unchanged
  });

  it('handles season - scalar replacement', () => {
    const state = makeInitialState();
    const impact: StateImpact = { season: 'Winter' };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.season).toBe('Winter');
  });

  it('handles weather - scalar replacement', () => {
    const state = makeInitialState();
    const impact: StateImpact = { weather: 'Rainy' as WeatherType };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.weather).toBe('Rainy');
  });

  it('handles day - scalar replacement', () => {
    const state = makeInitialState();
    const impact: StateImpact = { day: 3 };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.day).toBe(3);
  });

  it('handles realmRankings - replaces rankings object', () => {
    const state = makeInitialState();
    const rankings: Record<string, RankingEntry> = {
      w1: { overallRank: 1, tierRank: 1, fame: 100 } as any,
    };
    const impact: StateImpact = { realmRankings: rankings };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.realmRankings).toEqual(rankings);
  });

  it('handles crowdMood - replaces mood value', () => {
    const state = makeInitialState();
    const impact: StateImpact = { crowdMood: 'Bloodthirsty' as CrowdMoodType };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.crowdMood).toBe('Bloodthirsty');
  });

  it('handles isTournamentWeek - boolean replacement', () => {
    const state = makeInitialState();
    const impact: StateImpact = { isTournamentWeek: true };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.isTournamentWeek).toBe(true);
  });

  it('handles activeTournamentId - replaces tournament ID', () => {
    const state = makeInitialState();
    const impact: StateImpact = { activeTournamentId: 't1' as any };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.activeTournamentId).toBe('t1');
  });

  it('handles lastSimulationReport - replaces simulation report', () => {
    const state = makeInitialState();
    const report = { treasuryChange: 100, trainingGains: [], agingEvents: [] };
    const impact: StateImpact = { lastSimulationReport: report as any };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.lastSimulationReport).toEqual(report);
  });

  it('handles promoters - replaces promoters object', () => {
    const state = makeInitialState();
    const promoters: Record<string, Promoter> = {
      p1: {
        id: 'p1' as any,
        name: 'Promoter 1',
        age: 40,
        personality: 'Fair' as any,
        tier: 'Local',
        capacity: 5,
        biases: [],
        history: { totalPursePaid: 1000, notableBouts: [], legacyFame: 0 },
      },
    };
    const impact: StateImpact = { promoters };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.promoters).toEqual(promoters);
  });

  it('handles recruitPool - replaces recruit pool array', () => {
    const state = makeInitialState();
    const pool = [{ id: 'r1' as any, name: 'Recruit 1' }] as PoolWarrior[];
    const impact: StateImpact = { recruitPool: pool };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.recruitPool).toHaveLength(1);
    expect(newState.recruitPool[0]?.id).toBe('r1');
  });

  it('handles trainers - replaces trainers array', () => {
    const state = makeInitialState();
    const impact: StateImpact = { trainers: [makeTrainer('t1')] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.trainers).toHaveLength(1);
    expect(newState.trainers[0]?.id).toBe('t1');
  });

  it('handles hiringPool - replaces hiring pool array', () => {
    const state = makeInitialState();
    const impact: StateImpact = { hiringPool: [makeTrainer('h1')] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.hiringPool).toHaveLength(1);
    expect(newState.hiringPool[0]?.id).toBe('h1');
  });

  it('handles gazettes - replaces gazettes array', () => {
    const state = makeInitialState();
    const gazette: GazetteStory = {
      id: 'g1' as any,
      week: 1,
      headline: 'Test',
      body: 'Test body',
      mood: 'Calm' as CrowdMoodType,
      tags: ['test'],
    };
    const impact: StateImpact = { gazettes: [gazette] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.gazettes).toHaveLength(1);
    expect(newState.gazettes[0]?.id).toBe('g1');
  });

  it('handles ownerGrudges - replaces grudges array', () => {
    const state = makeInitialState();
    const grudge: OwnerGrudge = {
      id: 'g1' as any,
      ownerIdA: 'player' as any,
      ownerIdB: 'rival-1' as any,
      intensity: 5,
      reason: 'Test',
      startWeek: 1,
      lastEscalation: 1,
    };
    const impact: StateImpact = { ownerGrudges: [grudge] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.ownerGrudges).toHaveLength(1);
    expect(newState.ownerGrudges[0]?.id).toBe('g1');
  });

  it('handles rivalries - replaces rivalries array', () => {
    const state = makeInitialState();
    const rivalry: Rivalry = {
      id: 'r1' as any,
      stableIdA: 'player' as any,
      stableIdB: 'rival-1' as any,
      intensity: 5,
      reason: 'Test',
      startWeek: 1,
    };
    const impact: StateImpact = { rivalries: [rivalry] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.rivalries).toHaveLength(1);
    expect(newState.rivalries[0]?.id).toBe('r1');
  });

  it('handles trainingAssignments - replaces assignments array', () => {
    const state = makeInitialState();
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as any,
      type: 'attribute',
      attribute: 'ST',
    };
    const impact: StateImpact = { trainingAssignments: [assignment] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.trainingAssignments).toHaveLength(1);
    expect(newState.trainingAssignments[0]?.warriorId).toBe('w1');
  });

  // Phase 3: Complex/Custom Handlers
  it('handles rivalsUpdates - Map merge on rivals array', () => {
    const state = makeInitialState();
    state.rivals = [makeRival()];
    const rivalsUpdates = new Map<any, Partial<RivalStableData>>();
    rivalsUpdates.set(state.rivals[0]!.id as any, { fame: 100 });
    const impact: StateImpact = { rivalsUpdates };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.rivals).toHaveLength(1);
    expect(newState.rivals[0]?.fame).toBe(100);
  });

  it('handles rivalsUpdates - multiple stable updates', () => {
    const state = makeInitialState();
    const rival1 = makeRival('r1');
    const rival2 = makeRival('r2');
    state.rivals = [rival1, rival2];
    const rivalsUpdates = new Map<any, Partial<RivalStableData>>();
    rivalsUpdates.set(rival1.id as any, { fame: 100 });
    rivalsUpdates.set(rival2.id as any, { treasury: 2000 });
    const impact: StateImpact = { rivalsUpdates };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.rivals).toHaveLength(2);
    expect(newState.rivals[0]?.fame).toBe(100);
    expect(newState.rivals[1]?.treasury).toBe(2000);
  });

  it('handles boutOffers - dict merge (object spread)', () => {
    const state = makeInitialState();
    const boutOffer: BoutOffer = {
      id: 'b1' as any,
      promoterId: 'p1' as any,
      warriorIds: ['w1' as any],
      boutWeek: 1,
      expirationWeek: 2,
      purse: 500,
      hype: 0,
      status: 'Pending' as any,
      responses: {},
    };
    const impact: StateImpact = { boutOffers: { b1: boutOffer } as any };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.boutOffers['b1' as any]).toEqual(boutOffer);
  });

  it('handles boutOffers - key collision', () => {
    const state = makeInitialState();
    const offer1: BoutOffer = {
      id: 'b1' as any,
      promoterId: 'p1' as any,
      warriorIds: ['w1' as any],
      boutWeek: 1,
      expirationWeek: 2,
      purse: 500,
      hype: 0,
      status: 'Pending' as any,
      responses: {},
    };
    const offer2: BoutOffer = {
      id: 'b1' as any,
      promoterId: 'p2' as any,
      warriorIds: ['w2' as any],
      boutWeek: 1,
      expirationWeek: 2,
      purse: 600,
      hype: 0,
      status: 'Pending' as any,
      responses: {},
    };
    const impact1: StateImpact = { boutOffers: { b1: offer1 } as any };
    const impact2: StateImpact = { boutOffers: { b1: offer2 } as any };
    const newState = resolveImpacts(state, [impact1, impact2]);

    expect(newState.boutOffers['b1' as any]).toEqual(offer2); // Later impact wins
  });

  it('handles tournaments - hybrid merge (update existing by ID)', () => {
    const state = makeInitialState();
    const tournament: TournamentEntry = {
      id: 't1' as any,
      season: 'Spring',
      week: 1,
      tierId: 'regional',
      name: 'Tournament 1',
      bracket: [],
      participants: [],
      completed: false,
    };
    state.tournaments = [tournament];
    const updatedTournament: TournamentEntry = { ...tournament, completed: true };
    const impact: StateImpact = { tournaments: [updatedTournament] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.tournaments).toHaveLength(1);
    expect(newState.tournaments[0]?.completed).toBe(true);
  });

  it('handles tournaments - hybrid merge (add new)', () => {
    const state = makeInitialState();
    const tournament1: TournamentEntry = {
      id: 't1' as any,
      season: 'Spring',
      week: 1,
      tierId: 'regional',
      name: 'Tournament 1',
      bracket: [],
      participants: [],
      completed: false,
    };
    const tournament2: TournamentEntry = {
      id: 't2' as any,
      season: 'Spring',
      week: 2,
      tierId: 'national',
      name: 'Tournament 2',
      bracket: [],
      participants: [],
      completed: false,
    };
    state.tournaments = [tournament1];
    const impact: StateImpact = { tournaments: [tournament2] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.tournaments).toHaveLength(2);
    expect(newState.tournaments[1]?.id).toBe('t2');
  });

  it('handles tournaments - ID collision (update existing)', () => {
    const state = makeInitialState();
    const tournament1: TournamentEntry = {
      id: 't1' as any,
      season: 'Spring',
      week: 1,
      tierId: 'regional',
      name: 'Tournament 1',
      bracket: [],
      participants: [],
      completed: false,
    };
    const tournament2: TournamentEntry = {
      id: 't1' as any,
      season: 'Spring',
      week: 1,
      tierId: 'national',
      name: 'Tournament 1 Updated',
      bracket: [],
      participants: [],
      completed: true,
    };
    state.tournaments = [tournament1];
    const impact: StateImpact = { tournaments: [tournament2] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.tournaments).toHaveLength(1);
    expect(newState.tournaments[0]?.name).toBe('Tournament 1 Updated');
  });

  it('handles tournaments - empty state', () => {
    const state = makeInitialState();
    state.tournaments = [];
    const tournament: TournamentEntry = {
      id: 't1' as any,
      season: 'Spring',
      week: 1,
      tierId: 'regional',
      name: 'Tournament 1',
      bracket: [],
      participants: [],
      completed: false,
    };
    const impact: StateImpact = { tournaments: [tournament] };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.tournaments).toHaveLength(1);
  });

  // Phase 4: Edge Cases & Integration
  it('handles empty impacts array', () => {
    const state = makeInitialState();
    const newState = resolveImpacts(state, []);

    expect(newState).toEqual(state);
  });

  it('handles undefined values in impacts', () => {
    const state = makeInitialState();
    const impact: StateImpact = { treasuryDelta: undefined, week: undefined };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.treasury).toBe(state.treasury);
    expect(newState.week).toBe(state.week);
  });

  it('handles mixed strategy impacts in single call', () => {
    const state = makeInitialState();
    const impact: StateImpact = {
      treasuryDelta: 100, // accumulate
      arenaHistory: [makeFightSummary('f1')], // append
      week: 5, // replace
    };
    const newState = resolveImpacts(state, [impact]);

    expect(newState.treasury).toBe(1100);
    expect(newState.arenaHistory).toHaveLength(1);
    expect(newState.week).toBe(5);
  });

  it('verifies state immutability - original state unchanged', () => {
    const state = makeInitialState();
    const originalTreasury = state.treasury;
    const originalWeek = state.week;
    const impact: StateImpact = { treasuryDelta: 100, week: 5 };
    const newState = resolveImpacts(state, [impact]);

    expect(state.treasury).toBe(originalTreasury);
    expect(state.week).toBe(originalWeek);
    expect(newState.treasury).toBe(1100);
    expect(newState.week).toBe(5);
  });

  it('handles multiple impacts with same field (accumulation behavior)', () => {
    const state = makeInitialState();
    const impact1: StateImpact = { treasuryDelta: 100 };
    const impact2: StateImpact = { treasuryDelta: 200 };
    const impact3: StateImpact = { treasuryDelta: -50 };
    const newState = resolveImpacts(state, [impact1, impact2, impact3]);

    expect(newState.treasury).toBe(1250); // 1000 + 100 + 200 - 50
  });
});
