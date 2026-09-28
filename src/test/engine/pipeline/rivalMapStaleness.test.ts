import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior as fixtureWarrior, makeGameState as fixtureGameState, makeRivalStable } from '@/test/_fixtures/factories';

const makeWarrior = (id: string, name: string): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    age: 20,
  } as any);

const makeRival = (id: string, roster: Warrior[]): RivalStableData =>
  makeRivalStable(id, roster);

const makeState = (rivals: RivalStableData[]): GameState =>
  fixtureGameState({
    fame: 50,
    roster: [makeWarrior('w1', 'Alice'), makeWarrior('w2', 'Bob')],
    rivals,
    recruitPool: [],
    activeTournamentId: undefined,
    lastSimulationReport: undefined,
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any);

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
