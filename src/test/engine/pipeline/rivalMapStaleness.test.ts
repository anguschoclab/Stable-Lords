import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';

function makeWarrior(id: string, name: string): Warrior {
  return {
    id: id as WarriorId,
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

function makeRival(id: string, roster: Warrior[]): RivalStableData {
  return {
    id: id as StableId,
    fame: 50,
    owner: {
      id: `owner-${id}` as any,
      name: `Owner ${id}`,
      fame: 50,
      stableName: `Stable ${id}`,
      renown: 5,
      titles: 0,
    },
    roster,
    treasury: 1000,
    tier: 'Established' as any,
    ledger: [],
    trainingAssignments: [],
  };
}

function makeState(rivals: RivalStableData[]): GameState {
  return {
    treasury: 1000,
    fame: 50,
    week: 1,
    season: 'Spring',
    weather: 'Clear',
    day: 0,
    year: 1,
    roster: [makeWarrior('w1', 'Alice'), makeWarrior('w2', 'Bob')],
    rivals,
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
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any;
}

describe('NF2: rivalMap staleness after bout phase', () => {
  it('rivalMap should reflect updated roster after resolveImpacts (currently fails — bug)', () => {
    const rivalWarrior = makeWarrior('rw1', 'Rival Fighter');
    const rival = makeRival('rival-1', [rivalWarrior]);
    const state = makeState([rival]);

    // Simulate what buildWeekCaches does: build rivalMap from state.rivals
    const rivalMap = new Map<string, RivalStableData>();
    state.rivals!.forEach((r) => rivalMap.set(r.id, r));
    state.rivalMap = rivalMap;

    // Simulate what bout phase does: a rival warrior dies, update rivals via impact
    const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
    rivalsUpdates.set('rival-1' as StableId, { roster: [] });

    const graveyardImpact: Warrior[] = [{ ...rivalWarrior, isDead: true, status: 'Dead' as any }];

    const impact: StateImpact = {
      rivalsUpdates,
      graveyard: graveyardImpact,
    };

    // Apply impacts — this updates state.rivals but NOT state.rivalMap
    resolveImpacts(state, [impact]);

    // state.rivals should reflect the updated roster (empty)
    expect(state.rivals![0]!.roster.length).toBe(0);

    // CORRECT behavior: rivalMap should also reflect the updated roster (empty)
    // This currently FAILS because rivalMap is not rebuilt after impacts.
    const cachedRival = state.rivalMap!.get('rival-1');
    expect(cachedRival!.roster.length).toBe(0);
  });

  it('rivalMap should not contain dead warriors after bout phase', () => {
    const rivalWarrior = makeWarrior('rw1', 'Rival Fighter');
    const rival = makeRival('rival-1', [rivalWarrior]);
    const state = makeState([rival]);

    // Build caches
    const rivalMap = new Map<string, RivalStableData>();
    state.rivals!.forEach((r) => rivalMap.set(r.id, r));
    state.rivalMap = rivalMap;

    // Simulate bout phase: warrior dies
    const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
    rivalsUpdates.set('rival-1' as StableId, { roster: [] });

    resolveImpacts(state, [{ rivalsUpdates, graveyard: [{ ...rivalWarrior, isDead: true }] }]);

    // CORRECT behavior: rivalMap should not contain the dead warrior
    // This currently FAILS because rivalMap is not rebuilt.
    const cachedRival = state.rivalMap!.get('rival-1');
    const hasDeadWarrior = cachedRival!.roster.some((w) => w.id === 'rw1');
    expect(hasDeadWarrior).toBe(false);
  });
});
