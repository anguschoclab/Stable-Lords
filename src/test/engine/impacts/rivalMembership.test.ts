import { describe, it, expect } from 'vitest';
import { mergeImpacts, resolveImpacts, type StateImpact } from '@/engine/impacts';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';

const W = (id: string) => ({ id: id as WarriorId, name: id }) as unknown as Warrior;
const rival = (id: string, roster: Warrior[], extra: Record<string, unknown> = {}) =>
  ({ id: id as StableId, roster, treasury: 0, ...extra }) as unknown as RivalStableData;

describe('rivalsAdditions — new stables join the world', () => {
  it('appends a new stable and rebuilds rivalMap', () => {
    const a = rival('a', [W('a1')]);
    const state = { rivals: [a], rivalMap: new Map() } as unknown as GameState;
    const entrant = rival('newcomer', [W('n1')]);

    const out = resolveImpacts(state, [{ rivalsAdditions: [entrant] }]);

    expect(out.rivals.map((r) => r.id)).toEqual(['a', 'newcomer']);
    expect(out.rivalMap?.get('newcomer' as StableId)).toBe(entrant);
  });

  it('ignores an addition whose id is already live — no duplicate stables', () => {
    const a = rival('a', [W('a1')], { treasury: 500 });
    const state = { rivals: [a], rivalMap: new Map() } as unknown as GameState;

    const out = resolveImpacts(state, [
      { rivalsAdditions: [rival('a', [W('imposter')], { treasury: -1 })] },
    ]);

    expect(out.rivals).toHaveLength(1);
    expect(out.rivals[0]).toBe(a);
  });

  it('concatenates additions across merged impacts', () => {
    const state = { rivals: [], rivalMap: new Map() } as unknown as GameState;
    const merged = mergeImpacts([
      { rivalsAdditions: [rival('x', [])] },
      { rivalsAdditions: [rival('y', [])] },
    ] as StateImpact[]);
    const out = resolveImpacts(state, [merged]);

    expect(out.rivals.map((r) => r.id)).toEqual(['x', 'y']);
  });
});

describe('rivalsRemovals — stables leave the world', () => {
  it('removes a stable and its roster from rivals and rivalMap', () => {
    const a = rival('a', [W('a1')]);
    const dead = rival('dead', [W('d1'), W('d2')]);
    const c = rival('c', [W('c1')]);
    const state = { rivals: [a, dead, c], rivalMap: new Map() } as unknown as GameState;

    const out = resolveImpacts(state, [{ rivalsRemovals: ['dead' as StableId] }]);

    expect(out.rivals.map((r) => r.id)).toEqual(['a', 'c']);
    expect(out.rivalMap?.has('dead' as StableId)).toBe(false);
    expect(out.rivalMap?.get('a' as StableId)).toBe(a);
  });

  it('a rivalsUpdates entry for a removed stable is a no-op', () => {
    const dead = rival('dead', [W('d1')]);
    const state = { rivals: [dead], rivalMap: new Map() } as unknown as GameState;

    const out = resolveImpacts(state, [
      {
        rivalsRemovals: ['dead' as StableId],
        rivalsUpdates: new Map([['dead' as StableId, { treasury: 9999 }]]),
      },
    ]);

    expect(out.rivals).toHaveLength(0);
  });

  it('concatenates removals across merged impacts', () => {
    const a = rival('a', []);
    const b = rival('b', []);
    const c = rival('c', []);
    const state = { rivals: [a, b, c], rivalMap: new Map() } as unknown as GameState;
    const merged = mergeImpacts([
      { rivalsRemovals: ['a' as StableId] },
      { rivalsRemovals: ['c' as StableId] },
    ] as StateImpact[]);
    const out = resolveImpacts(state, [merged]);

    expect(out.rivals.map((r) => r.id)).toEqual(['b']);
  });
});
