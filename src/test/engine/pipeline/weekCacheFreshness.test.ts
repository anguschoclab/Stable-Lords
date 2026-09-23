import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { resolveImpacts } from '@/engine/impacts';
import { buildWeekCaches } from '@/engine/pipeline/services/weekPipelineService';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';

/**
 * Finding #9 guard: impact handlers REPLACE warrior/rival objects rather
 * than mutating them, so the per-week lookup caches (warriorMap, rivalMap,
 * warriorToStableMap) hold stale pre-impact identities unless resynced.
 * buildWeekCaches must run after every resolveImpacts boundary and point at
 * the post-impact objects.
 */
function makeWarrior(id: string, stableId?: string): Warrior {
  return {
    id: id as WarriorId,
    name: `W-${id}`,
    status: 'Active',
    stableId: stableId as StableId | undefined,
    injuries: [],
    fame: 10,
  } as unknown as Warrior;
}

function stateWithWarriors(): GameState {
  const state = createFreshState('cache-freshness');
  const pw = makeWarrior('pw1');
  const rw = makeWarrior('rw1', 'rival-1');
  state.roster = [pw];
  state.rivals = [
    {
      id: 'rival-1' as StableId,
      owner: { id: 'owner-1' } as never,
      roster: [rw],
      treasury: 0,
      fame: 0,
      ledger: [],
      trainingAssignments: [],
    } as never,
  ];
  return state;
}

describe('week cache freshness after impact resolution', () => {
  it('warriorMap returns the post-impact warrior object, not the stale one', () => {
    const state = stateWithWarriors();
    buildWeekCaches(state);
    const staleRef = state.warriorMap!.get('pw1' as WarriorId);
    expect(staleRef).toBe(state.roster[0]);

    // rosterUpdates replaces the warrior object (never mutates in place).
    const resolved = resolveImpacts(state, [
      { rosterUpdates: new Map([['pw1' as WarriorId, { fame: 42 }]]) },
    ]);
    buildWeekCaches(resolved);

    const freshRef = resolved.warriorMap!.get('pw1' as WarriorId);
    expect(freshRef).toBe(resolved.roster[0]);
    expect(freshRef).not.toBe(staleRef);
    expect(freshRef?.fame).toBe(42);
    expect(staleRef?.fame).toBe(10);
  });

  it('rivalMap and warriorMap reflect rivalsUpdates roster replacements', () => {
    const state = stateWithWarriors();
    buildWeekCaches(state);
    const staleRival = state.rivalMap!.get('rival-1');
    const staleWarrior = state.warriorMap!.get('rw1' as WarriorId);

    const newRoster = [{ ...state.rivals[0]!.roster[0]!, fame: 77 } as Warrior];
    const resolved = resolveImpacts(state, [
      {
        rivalsUpdates: new Map([
          ['rival-1' as StableId, { roster: newRoster, fame: 5 }],
        ]),
      },
    ]);
    buildWeekCaches(resolved);

    const freshRival = resolved.rivalMap!.get('rival-1');
    expect(freshRival).toBe(resolved.rivals[0]);
    expect(freshRival).not.toBe(staleRival);
    expect(freshRival?.fame).toBe(5);
    expect(resolved.warriorMap!.get('rw1' as WarriorId)).toBe(resolved.rivals[0]!.roster[0]);
    expect(resolved.warriorMap!.get('rw1' as WarriorId)).not.toBe(staleWarrior);
  });

  it('warriorToStableMap survives roster replacement', () => {
    const state = stateWithWarriors();
    const resolved = resolveImpacts(state, [
      { rosterUpdates: new Map([['pw1' as WarriorId, { fame: 1 }]]) },
      {
        rivalsUpdates: new Map([
          ['rival-1' as StableId, { roster: [makeWarrior('rw1', 'rival-1')] }],
        ]),
      },
    ]);
    buildWeekCaches(resolved);

    expect(resolved.warriorToStableMap!.get('pw1')).toEqual({
      stableId: state.player.id,
      isPlayer: true,
    });
    expect(resolved.warriorToStableMap!.get('rw1')).toEqual({
      stableId: 'rival-1',
      isPlayer: false,
    });
  });
});
