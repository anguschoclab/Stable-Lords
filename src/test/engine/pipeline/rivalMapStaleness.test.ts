import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import {
    makeGameState as fixtureGameState,
  makeRivalStable,
} from '@/test/_fixtures/factories';
import { makeBareWarrior } from '@/test/_fixtures/statWarrior';

const makeWarrior = makeBareWarrior;

const makeRival = (id: string, roster: Warrior[]): RivalStableData => makeRivalStable(id, roster);

const makeState = (rivals: RivalStableData[]): GameState =>
  fixtureGameState({
    fame: 50,
    roster: [makeWarrior('w1', 'Alice'), makeWarrior('w2', 'Bob')],
    rivals,
    recruitPool: [],
    activeTournamentId: undefined,
    stewardReport: undefined,
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any);

describe('rivalMap staleness after bout phase', () => {
  it('rivalMap reflects the updated roster after resolveImpacts', () => {
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

    // Apply impacts — updates state.rivals and rebuilds the rivalMap cache.
    resolveImpacts(state, [impact]);

    // state.rivals should reflect the updated roster (empty)
    expect(state.rivals![0]!.roster.length).toBe(0);

    // rivalMap is rebuilt alongside rivals, so the cache holds the empty roster
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

    // rivalMap is rebuilt alongside rivals, so the dead warrior leaves the cache
    const cachedRival = state.rivalMap!.get('rival-1');
    const hasDeadWarrior = cachedRival!.roster.some((w) => w.id === 'rw1');
    expect(hasDeadWarrior).toBe(false);
  });
});
