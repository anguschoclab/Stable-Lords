import { describe, it, expect } from 'vitest';
// V30-W1.6: one ownership resolver — map-backed for hot paths, roster/rival
// scan fallback — replacing isPlayerOwned / owningStableOf / warriorToStableMap
// reads / inline stableId checks for single-entity lookups.
import { resolveWarriorOwner, isPlayerOwnedWarrior } from '@/engine/core/warriorOwnership';
import { makeWarrior, makeRivalStable } from '@/test/_fixtures/factories';
import { makeAiTestState } from '@/test/_fixtures/aiTestState';
import type { WarriorId, StableId } from '@/types/shared.types';

const playerW = makeWarrior({ id: 'pw' as WarriorId, stableId: 'p1' as StableId });
const rivalW = makeWarrior({ id: 'rw' as WarriorId, stableId: 'r1' as StableId });
// The resolver returns the stable's full identity triple — one shape serves
// both isPlayer checks and stableName consumers (arenaChampionship).

const state = (extra: Record<string, unknown> = {}) =>
  makeAiTestState({
    roster: [playerW],
    rivals: [makeRivalStable('r1', [rivalW])],
    ...extra,
  });

describe('resolveWarriorOwner (V30 single resolver)', () => {
  it('resolves player-owned warriors → player stableId, isPlayer=true', () => {
    const s = state();
    expect(resolveWarriorOwner(s, 'pw' as WarriorId)).toEqual({
      stableId: 'p1',
      stableName: s.player.stableName,
      isPlayer: true,
    });
  });

  it('resolves rival-owned warriors → rival stableId, isPlayer=false', () => {
    const s = state();
    expect(resolveWarriorOwner(s, 'rw' as WarriorId)).toEqual({
      stableId: 'r1',
      stableName: s.rivals![0]!.owner.stableName,
      isPlayer: false,
    });
  });

  it('returns null for unknown/free-agent warrior ids', () => {
    const s = state();
    expect(resolveWarriorOwner(s, 'ghost' as WarriorId)).toBeNull();
  });

  it('prefers the cached warriorToStableMap when present (pipeline hot path)', () => {
    const s = state({
      warriorToStableMap: new Map([
        ['pw', { stableId: 'p1', isPlayer: true }],
        ['rw', { stableId: 'r1', isPlayer: false }],
      ]),
    });
    expect(resolveWarriorOwner(s, 'rw' as WarriorId)!.stableId).toBe('r1');
  });

  it('still resolves correctly when the map is absent (UI/manual paths)', () => {
    const s = state({ warriorToStableMap: undefined });
    expect(resolveWarriorOwner(s, 'rw' as WarriorId)!.stableId).toBe('r1');
    expect(resolveWarriorOwner(s, 'pw' as WarriorId)!.stableId).toBe('p1');
  });
});

describe('isPlayerOwnedWarrior', () => {
  it('true for player roster members, false otherwise', () => {
    const s = state();
    expect(isPlayerOwnedWarrior(s, 'pw' as WarriorId)).toBe(true);
    expect(isPlayerOwnedWarrior(s, 'rw' as WarriorId)).toBe(false);
    expect(isPlayerOwnedWarrior(s, 'ghost' as WarriorId)).toBe(false);
  });
});
