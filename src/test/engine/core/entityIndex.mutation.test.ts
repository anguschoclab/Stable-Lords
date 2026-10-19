/**
 * getWarriorIndex shared-instance contract — the returned map is the
 * cached index itself: repeated calls return the SAME Map, so callers
 * must treat it as read-only (mutate a copy, never the index).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getWarriorIndex, clearEntityIndexCaches } from '@/engine/core/entityIndex';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';

describe('getWarriorIndex — shared-instance contract', () => {
  beforeEach(() => clearEntityIndexCaches());

  it('returns the same Map instance across calls (cached, not rebuilt)', () => {
    const state = {
      roster: [makeWarrior({ id: 'w-1' as WarriorId, name: 'Alice' })],
      graveyard: [],
      retired: [],
      rivals: [],
    };
    expect(getWarriorIndex(state as never)).toBe(getWarriorIndex(state as never));
  });

  it('a defensive copy can be mutated without corrupting the index', () => {
    const state = {
      roster: [makeWarrior({ id: 'w-1' as WarriorId })],
      graveyard: [],
      retired: [],
      rivals: [],
    };
    const mutable = new Map(getWarriorIndex(state as never));
    mutable.delete('w-1');
    mutable.set('bogus', makeWarrior({ id: 'bogus' as WarriorId }));

    const shared = getWarriorIndex(state as never);
    expect(shared.has('w-1')).toBe(true);
    expect(shared.has('bogus')).toBe(false);
  });

  it('still covers graveyard/retired/rivals', () => {
    const state = {
      roster: [makeWarrior({ id: 'w-1' as WarriorId })],
      graveyard: [makeWarrior({ id: 'w-2' as WarriorId })],
      retired: [makeWarrior({ id: 'w-3' as WarriorId })],
      rivals: [{ roster: [makeWarrior({ id: 'w-4' as WarriorId })] }],
    };
    expect(getWarriorIndex(state as never).size).toBe(4);
  });
});
