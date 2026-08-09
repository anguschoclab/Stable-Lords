import { describe, it, expect } from 'vitest';
import { resolveImpacts, mergeImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState, Warrior } from '@/types/state.types';
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

function makeState(): GameState {
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

describe('impactMergeOrder', () => {
  it('two impacts with treasuryDelta should accumulate (not replace)', () => {
    const state = makeState();
    const impacts: StateImpact[] = [{ treasuryDelta: 100 }, { treasuryDelta: 200 }];
    resolveImpacts(state, impacts);
    expect(state.treasury).toBe(1300); // 1000 + 100 + 200
  });

  it('two impacts with season should use last-wins (replace)', () => {
    const state = makeState();
    const impacts: StateImpact[] = [{ season: 'Summer' as any }, { season: 'Winter' as any }];
    resolveImpacts(state, impacts);
    expect(state.season).toBe('Winter');
  });

  it('two impacts with rosterUpdates should merge by warrior ID', () => {
    const state = makeState();
    const map1 = new Map<WarriorId, Partial<Warrior>>();
    map1.set('w1' as WarriorId, { fame: 10 });
    const map2 = new Map<WarriorId, Partial<Warrior>>();
    map2.set('w1' as WarriorId, { age: 25 });
    map2.set('w2' as WarriorId, { fame: 5 });

    const impacts: StateImpact[] = [{ rosterUpdates: map1 }, { rosterUpdates: map2 }];
    resolveImpacts(state, impacts);

    const w1 = state.roster.find((w) => w.id === 'w1')!;
    const w2 = state.roster.find((w) => w.id === 'w2')!;
    // w1 should get fame from first impact (applied first)
    expect(w1.fame).toBe(10);
    // w2 should get fame from second impact
    expect(w2.fame).toBe(5);
  });

  it('mergeImpacts with boutOffers should dict-merge by offer ID', () => {
    const merged = mergeImpacts([
      { boutOffers: { offer1: { id: 'offer1', status: 'Proposed' } } as any },
      { boutOffers: { offer2: { id: 'offer2', status: 'Signed' } } as any },
    ]);

    expect(merged.boutOffers).toBeDefined();
    expect(Object.keys(merged.boutOffers!)).toContain('offer1');
    expect(Object.keys(merged.boutOffers!)).toContain('offer2');
  });

  it('mergeImpacts with treasuryDelta should accumulate', () => {
    const merged = mergeImpacts([{ treasuryDelta: 100 }, { treasuryDelta: 250 }]);
    expect(merged.treasuryDelta).toBe(350);
  });

  it('mergeImpacts with replace strategy uses last value', () => {
    const merged = mergeImpacts([{ season: 'Spring' as any }, { season: 'Fall' as any }]);
    expect(merged.season).toBe('Fall');
  });

  it('mergeImpacts with append strategy concatenates arrays', () => {
    const merged = mergeImpacts([
      { graveyard: [{ ...makeWarrior('g1', 'Ghost1'), isDead: true }] },
      { graveyard: [{ ...makeWarrior('g2', 'Ghost2'), isDead: true }] },
    ]);
    expect(merged.graveyard?.length).toBe(2);
  });
});
