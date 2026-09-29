import { describe, it, expect } from 'vitest';
import { mergeImpacts, resolveImpacts, type StateImpact } from '@/engine/impacts';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';

const W = (id: string) => ({ id: id as WarriorId, name: id }) as unknown as Warrior;
const rival = (id: string, roster: Warrior[], extra: Record<string, unknown> = {}) =>
  ({ id: id as StableId, roster, treasury: 0, ...extra }) as unknown as RivalStableData;

describe('rival replacements (bankruptcy succession)', () => {
  it('swaps a bankrupt stable for its successor in place', () => {
    const a = rival('a', [W('a1')]);
    const ghost = rival('ghost', [W('g1')], { treasury: -900, agentMemory: { stale: true } });
    const c = rival('c', [W('c1')]);
    const state = { rivals: [a, ghost, c], rivalMap: new Map() } as unknown as GameState;
    const successor = rival('heir', [W('h1')], { treasury: 500 });

    const out = resolveImpacts(state, [
      { rivalReplacements: new Map([['ghost' as StableId, successor]]) },
    ]);

    expect(out.rivals.map((r) => r.id)).toEqual(['a', 'heir', 'c']);
    // Full replacement — no fields leak from the bankrupt stable.
    expect(out.rivals[1]).toBe(successor);
    expect(out.rivalMap?.has('ghost' as StableId)).toBe(false);
    expect(out.rivalMap?.get('heir' as StableId)).toBe(successor);
  });

  it('applies before same-tick rivalsUpdates, so updates keyed by the successor land', () => {
    const ghost = rival('ghost', [W('g1')]);
    const state = { rivals: [ghost], rivalMap: new Map() } as unknown as GameState;
    const successor = rival('heir', [W('h1')]);

    // Merged order puts rivalsUpdates first — replacements must still win the race.
    const merged = mergeImpacts([
      { rivalsUpdates: new Map([['heir' as StableId, { treasury: 42 }]]) },
      { rivalReplacements: new Map([['ghost' as StableId, successor]]) },
    ] as StateImpact[]);
    const out = resolveImpacts(state, [merged]);

    expect(out.rivals.map((r) => r.id)).toEqual(['heir']);
    expect(out.rivals[0]!.treasury).toBe(42);
  });

  it('drops a successor whose id is already taken by a live stable', () => {
    const ghost = rival('ghost', [W('g1')]);
    const live = rival('heir', [W('h1')]);
    const state = { rivals: [ghost, live], rivalMap: new Map() } as unknown as GameState;

    const out = resolveImpacts(state, [
      { rivalReplacements: new Map([['ghost' as StableId, rival('heir', [W('x')])]]) },
    ]);

    expect(out.rivals.map((r) => r.id)).toEqual(['ghost', 'heir']);
    expect(out.rivals[1]).toBe(live);
  });
});
