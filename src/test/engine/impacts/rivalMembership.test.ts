import { describe, it, expect, vi, afterEach } from 'vitest';
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

describe('rivalsUpdates — EPITHET_DEBUG diagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.EPITHET_DEBUG;
  });

  it('logs roster-wipe and roster-drop while still applying the update', () => {
    process.env.EPITHET_DEBUG = '1';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wiped = { id: 'w1', name: 'W1', epithet: 'the Bold' } as unknown as Warrior;
    const dropped = { id: 'w2', name: 'W2', epithet: 'the Grim' } as unknown as Warrior;
    const quiet = { id: 'w3', name: 'W3' } as unknown as Warrior; // no epithet → no log
    const r = rival('r', [wiped, dropped, quiet], { owner: { stableName: 'Doom' } });
    const state = { rivals: [r], absoluteWeek: 7 } as unknown as GameState;

    const rosterUpdate = { roster: [{ id: 'w1' } as unknown as Warrior] };
    const out = resolveImpacts(state, [
      { rivalsUpdates: new Map([['r' as StableId, rosterUpdate]]) },
    ]);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('roster-wipe'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('roster-drop'));
    // Diagnostic path must not change the applied result.
    expect(out.rivals[0]!.roster).toHaveLength(1);
    expect(out.rivals[0]!.roster[0]!.id).toBe('w1');
  });
});
