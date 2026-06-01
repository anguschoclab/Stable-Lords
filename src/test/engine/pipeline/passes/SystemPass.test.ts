import { describe, it, expect } from 'vitest';
import { runSystemPass } from '@/engine/pipeline/passes/SystemPass';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { WarriorId } from '@/types/shared.types';

describe('SystemPass Snapshotting Logic', () => {
  it('creates initial yearly snapshots on Year 1 Week 1 if absent', () => {
    const baseState = createFreshState('seed-1');
    baseState.week = 1;
    baseState.year = 1;
    baseState.season = 'Spring';

    const warriorId = 'test-warrior-1' as WarriorId;
    baseState.roster = [
      {
        id: warriorId,
        name: 'Test Warrior',
        career: { wins: 5, losses: 2, kills: 1 },
        fame: 100,
        yearlySnapshots: undefined,
      } as any,
    ];
    baseState.rivals = [];

    const impact = runSystemPass(baseState);

    expect(impact.rosterUpdates).toBeDefined();
    const warriorUpdate = impact.rosterUpdates?.get(warriorId);
    expect(warriorUpdate?.yearlySnapshots?.[1]).toBeDefined();
    expect(warriorUpdate?.yearlySnapshots?.[1]?.wins).toBe(5);
  });

  it('creates yearly snapshots on the transition tick (Week 52 → Week 1)', () => {
    const baseState = createFreshState('seed-2');
    baseState.week = 52; // End of Year 1 — the transition tick
    baseState.year = 1;
    baseState.season = 'Winter';

    const warriorId = 'test-warrior-2' as WarriorId;
    baseState.roster = [
      {
        id: warriorId,
        name: 'Year 2 Warrior',
        career: { wins: 15, losses: 5, kills: 2 },
        fame: 250,
        yearlySnapshots: {
          1: { wins: 5, losses: 2, kills: 1, fame: 100 },
        },
      } as any,
    ];
    baseState.rivals = [];

    const impact = runSystemPass(baseState);

    expect(impact.rosterUpdates).toBeDefined();
    const warriorUpdate = impact.rosterUpdates?.get(warriorId);

    // Snapshot for Year 2 should be created *during* the transition tick,
    // before any Year 2 bouts are fought.
    expect(warriorUpdate?.yearlySnapshots?.[2]).toBeDefined();
    expect(warriorUpdate?.yearlySnapshots?.[2]?.wins).toBe(15);

    // It should also have preserved the Year 1 snapshot
    expect(warriorUpdate?.yearlySnapshots?.[1]).toBeDefined();
    expect(warriorUpdate?.yearlySnapshots?.[1]?.wins).toBe(5);
  });

  it('does NOT create snapshots on a post-rollover tick (they were already created on the transition tick)', () => {
    const baseState = createFreshState('seed-3');
    baseState.week = 1;
    baseState.year = 2; // Already rolled over to Year 2
    baseState.season = 'Spring';

    const warriorId = 'test-warrior-3' as WarriorId;
    baseState.roster = [
      {
        id: warriorId,
        name: 'Post-Rollover Warrior',
        career: { wins: 20, losses: 5, kills: 3 },
        fame: 300,
        yearlySnapshots: {
          1: { wins: 5, losses: 2, kills: 1, fame: 100 },
          2: { wins: 15, losses: 5, kills: 2, fame: 250 }, // Already snapshotted on transition tick
        },
      } as any,
    ];
    baseState.rivals = [];

    const impact = runSystemPass(baseState);

    // No snapshot should be created here — the Year 2 baseline was already
    // captured during the Week 52 → Week 1 transition tick.
    expect(impact.rosterUpdates).toBeUndefined();
  });
});
