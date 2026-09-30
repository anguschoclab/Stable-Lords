import { describe, it, expect } from 'vitest';
import { diffRivalMembership } from '@/engine/ai/worldManagement';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';

describe('diffRivalMembership', () => {
  it('classifies removed, added, and retained stables', () => {
    const dead = makeRival({ id: 'r-dead' as StableId });
    const keep = makeRival({ id: 'r-keep' as StableId });
    const added = makeRival({ id: 'r-new' as StableId });

    const diff = diffRivalMembership([dead, keep], [keep, added]);

    expect(diff.removedIds).toEqual(['r-dead']);
    expect(diff.additions).toEqual([added]);
    expect(diff.retained).toEqual([keep]);
  });

  it('returns empty diff buckets when membership is unchanged', () => {
    const keep = makeRival({ id: 'r-keep' as StableId });
    const diff = diffRivalMembership([keep], [keep]);
    expect(diff.removedIds).toEqual([]);
    expect(diff.additions).toEqual([]);
    expect(diff.retained).toEqual([keep]);
  });

  it('collects removed rosters so callers can route them onward', () => {
    const displaced = makeWarrior({ id: 'w-displaced' as WarriorId });
    const dead = makeRival({ id: 'r-dead' as StableId, roster: [displaced] });

    const diff = diffRivalMembership([dead], []);

    expect(diff.removedRosters.flat().map((w) => w.id)).toEqual(['w-displaced']);
  });
});
