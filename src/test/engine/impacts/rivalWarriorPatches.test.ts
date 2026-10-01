import { describe, it, expect } from 'vitest';
import { mergeImpacts, resolveImpacts, type StateImpact } from '@/engine/impacts';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';

const W = (id: string) =>
  ({
    id: id as WarriorId,
    name: id,
    career: { wins: 0, losses: 0, kills: 0 },
    fame: 0,
  }) as unknown as Warrior;
const rival = (id: string, roster: Warrior[]) =>
  ({ id: id as StableId, roster }) as unknown as RivalStableData;

describe('rival warrior patches (same-week bout merging)', () => {
  it('keeps updates from two bouts for warriors of the same rival stable', () => {
    const r = rival('r1', [W('a'), W('b'), W('c')]);
    const state = { rivals: [r], rivalMap: new Map([[r.id, r]]) } as unknown as GameState;

    // Bout 1: a beats someone. Bout 2: b loses and is killed. Both resolved
    // against the same pre-week state, merged last-wins per map key.
    const bout1: StateImpact = {
      rivalWarriorPatches: new Map([
        ['a' as WarriorId, { career: { wins: 1, losses: 0, kills: 0 } }],
      ]),
    };
    const bout2: StateImpact = {
      rivalWarriorPatches: new Map([
        ['b' as WarriorId, { career: { wins: 0, losses: 1, kills: 0 } }],
        ['a' as WarriorId, { lastBoutWeek: 7 }],
      ]),
      rivalRosterRemovals: ['b' as WarriorId],
    };

    const out = resolveImpacts(state, [mergeImpacts([bout1, bout2])]);
    const roster = out.rivals[0]!.roster;

    expect(roster.map((w) => w.id)).toEqual(['a', 'c']); // killed warrior removed
    const a = roster.find((w) => w.id === 'a')!;
    expect(a.career.wins).toBe(1); // bout 1's record survives bout 2's patch
    expect(a.lastBoutWeek).toBe(7);
    expect(out.rivalMap?.get('r1' as StableId)?.roster).toBe(roster); // cache in sync
  });
});
