import { describe, it, expect } from 'vitest';
import { changedFields, patchRivalWarrior } from '@/engine/bout/warriorRouting';
import { mkBoutWarrior } from './_helpers';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

/**
 * changedFields/patchRivalWarrior pin the reference-inequality diff contract:
 * bout handlers derive full warrior objects from the same pre-bout snapshot,
 * so a field is only emitted when its reference changed — a deep-equal but
 * distinct object must still be kept (later handlers may mutate it in place
 * and the stale-copy overwrite is exactly what this diff exists to prevent).
 */
describe('changedFields', () => {
  const before = mkBoutWarrior({ id: 'w1' as WarriorId, name: 'Alpha', fame: 10 });

  it('drops scalar fields identical to before', () => {
    expect(changedFields(before, { name: 'Alpha', fame: 10 })).toEqual({});
  });

  it('keeps scalar fields that changed', () => {
    expect(changedFields(before, { fame: 99 })).toEqual({ fame: 99 });
  });

  it('drops an object field when it is the same reference', () => {
    expect(changedFields(before, { career: before.career })).toEqual({});
  });

  it('keeps a deep-equal object field when the reference differs', () => {
    const clone = { ...before.career! };
    expect(changedFields(before, { career: clone })).toEqual({ career: clone });
  });

  it('returns only the changed keys from a mixed patch', () => {
    const out = changedFields(before, {
      name: 'Alpha',
      fame: 12,
      popularity: 5,
    });
    expect(out).toEqual({ fame: 12 });
    expect(out).not.toHaveProperty('name');
    expect(out).not.toHaveProperty('popularity');
  });

  it('ignores absent keys rather than diffing undefined', () => {
    expect(changedFields(before, {})).toEqual({});
  });
});

describe('patchRivalWarrior', () => {
  const before = mkBoutWarrior({ id: 'w1' as WarriorId, fame: 10 });

  it('does not create a map entry for an empty diff', () => {
    const patches = new Map<WarriorId, Partial<Warrior>>();
    patchRivalWarrior(patches, before, { fame: 10, name: before.name });
    expect(patches.size).toBe(0);
  });

  it('sets the per-warrior patch to the diff', () => {
    const patches = new Map<WarriorId, Partial<Warrior>>();
    patchRivalWarrior(patches, before, { fame: 11 });
    expect(patches.get(before.id)).toEqual({ fame: 11 });
  });

  it('merges with an earlier patch for the same warrior', () => {
    const patches = new Map<WarriorId, Partial<Warrior>>();
    patchRivalWarrior(patches, before, { fame: 11 });
    patchRivalWarrior(patches, before, { popularity: 7 });
    expect(patches.get(before.id)).toEqual({ fame: 11, popularity: 7 });
  });

  it('latest write wins on overlapping keys', () => {
    const patches = new Map<WarriorId, Partial<Warrior>>();
    patchRivalWarrior(patches, before, { fame: 11 });
    patchRivalWarrior(patches, before, { fame: 20 });
    expect(patches.get(before.id)).toEqual({ fame: 20 });
  });
});
