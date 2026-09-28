import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Warrior } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior as fixtureWarrior, makeGameState as fixtureGameState } from '@/test/_fixtures/factories';

const makeWarrior = (id: string): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name: id,
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
  } as any);

const makeState = (): GameState =>
  fixtureGameState({
    fame: 50,
    roster: [makeWarrior('w1'), makeWarrior('w2')],
    rivals: [],
    recruitPool: [],
    activeTournamentId: undefined,
    lastSimulationReport: undefined,
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any);

describe('resolveImpactsCoverage', () => {
  it('accumulate strategy: treasuryDelta adds to treasury', () => {
    const state = makeState();
    resolveImpacts(state, [{ treasuryDelta: 500 }]);
    expect(state.treasury).toBe(1500);
  });

  it('accumulate strategy: fameDelta adds to fame', () => {
    const state = makeState();
    resolveImpacts(state, [{ fameDelta: 10 }]);
    expect(state.fame).toBe(60);
  });

  it('replace strategy: season overwrites state.season', () => {
    const state = makeState();
    resolveImpacts(state, [{ season: 'Winter' as any }]);
    expect(state.season).toBe('Winter');
  });

  it('replace strategy: weather overwrites state.weather', () => {
    const state = makeState();
    resolveImpacts(state, [{ weather: 'Rain' as any }]);
    expect(state.weather).toBe('Rain');
  });

  it('append strategy: graveyard concatenates arrays', () => {
    const state = makeState();
    const w = makeWarrior('g1');
    resolveImpacts(state, [{ graveyard: [{ ...w, isDead: true }] }]);
    expect(state.graveyard!.length).toBe(1);
    resolveImpacts(state, [{ graveyard: [{ ...makeWarrior('g2'), isDead: true }] }]);
    expect(state.graveyard!.length).toBe(2);
  });

  it('append strategy: arenaHistory concatenates arrays', () => {
    const state = makeState();
    resolveImpacts(state, [{ arenaHistory: [{ id: 'f1' } as any] }]);
    expect(state.arenaHistory!.length).toBe(1);
    resolveImpacts(state, [{ arenaHistory: [{ id: 'f2' } as any] }]);
    expect(state.arenaHistory!.length).toBe(2);
  });

  it('mapMerge strategy: rosterUpdates merges by warrior ID', () => {
    const state = makeState();
    const updates = new Map<WarriorId, Partial<Warrior>>();
    updates.set('w1' as WarriorId, { fame: 100 });
    resolveImpacts(state, [{ rosterUpdates: updates }]);
    const w1 = state.roster.find((w) => w.id === 'w1')!;
    expect(w1.fame).toBe(100);
  });

  it('dictMerge strategy: boutOffers merges by offer ID', () => {
    const state = makeState();
    resolveImpacts(state, [
      { boutOffers: { offer1: { id: 'offer1', status: 'Proposed' } } as any },
    ]);
    expect(state.boutOffers!['offer1' as any]).toBeDefined();

    resolveImpacts(state, [{ boutOffers: { offer2: { id: 'offer2', status: 'Signed' } } as any }]);
    expect(state.boutOffers!['offer2' as any]).toBeDefined();
    expect(state.boutOffers!['offer1' as any]).toBeDefined();
  });
});
