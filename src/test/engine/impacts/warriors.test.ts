import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import { makeGameState, makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';

/**
 * Pins for the impacts/warriors in-loop scans:
 *  - rosterUpdates age→avatar invalidation lookup
 *  - warriorEpithets roster→rivals→tournaments precedence (indexBy first-wins)
 */
describe('warriorsHandlers — rosterUpdates', () => {
  it('drops the avatar cache only when the update crosses an age group', () => {
    const state = makeGameState({
      roster: [makeWarrior({ id: 'w1' as WarriorId, age: 30 }), makeWarrior({ id: 'w2' as WarriorId, age: 40 })],
      avatarCache: { w1: {} as any, w2: {} as any },
    });
    // w1: 30→31 same 'adult' band. w2: 40→50 crosses 'middle'→'elder'.
    resolveImpacts(state, [
      { rosterUpdates: new Map([[ 'w1' as WarriorId, { age: 31 }], ['w2' as WarriorId, { age: 50 }]]) },
    ]);
    expect(state.avatarCache?.w1).toBeDefined();
    expect(state.avatarCache?.w2).toBeUndefined();
  });
});

describe('warriorsHandlers — warriorEpithets', () => {
  it('stamps the roster copy when an id exists in multiple collections (precedence)', () => {
    const rosterW = makeWarrior({ id: 'w1' as WarriorId });
    const tournamentCopy = { ...rosterW, epithet: 'stale-snapshot' as any };
    const state = makeGameState({
      roster: [rosterW],
      tournaments: [
        {
          id: 't1' as any,
          season: 'Spring',
          week: 1,
          tierId: 't',
          name: 'Cup',
          bracket: [],
          participants: [tournamentCopy],
          completed: false,
        },
      ],
    });
    resolveImpacts(state, [
      { warriorEpithets: [{ warriorId: 'w1' as WarriorId, epithet: 'the Bloody' }] },
    ]);
    // The roster object wins — the stale tournament snapshot is untouched.
    expect(state.roster[0]!.epithet).toBe('the Bloody');
    expect(tournamentCopy.epithet).toBe('stale-snapshot');
  });

  it('reaches warriors only present in a rival roster', () => {
    const rivalW = makeWarrior({ id: 'rw1' as WarriorId });
    const state = makeGameState({
      roster: [],
      rivals: [makeRival({ id: 'r1' as StableId, owner: makeOwner({ id: 'r1' as StableId }), roster: [rivalW] })],
    });
    resolveImpacts(state, [
      { warriorEpithets: [{ warriorId: 'rw1' as WarriorId, epithet: 'the Reaper' }] },
    ]);
    expect(state.rivals[0]!.roster[0]!.epithet).toBe('the Reaper');
  });

  it('never downgrades a higher-rank epithet', () => {
    const state = makeGameState({ roster: [makeWarrior({ id: 'w1' as WarriorId, epithet: 'the Grand Champion' })] });
    resolveImpacts(state, [
      { warriorEpithets: [{ warriorId: 'w1' as WarriorId, epithet: 'the Bloody' }] },
    ]);
    expect(state.roster[0]!.epithet).toBe('the Grand Champion');
  });
});
