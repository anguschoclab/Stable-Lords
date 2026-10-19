import { describe, it, expect } from 'vitest';
import { runSystemPass } from '@/engine/pipeline/passes/SystemPass';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { WarriorId, StableId } from '@/types/shared.types';
import { makeRival, makeWarrior, makePoolWarrior } from '@/test/_fixtures/factories';
import type { RivalStableData } from '@/types/state.types';

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

describe('SystemPass — seasonal churn wiring', () => {
  // Week 13 → 14 crosses Spring → Summer, so processSeasonalChurn fires.
  const churnState = (rivals: RivalStableData[]) => {
    const state = createFreshState('churn-seed');
    state.week = 13;
    state.year = 1;
    state.season = 'Spring';
    state.absoluteWeek = 13;
    state.rivals = rivals;
    state.recruitPool = [];
    return state;
  };

  it('removes a bankrupt stable via rivalsRemovals instead of discarding the churn result', () => {
    const bankrupt = makeRival({
      id: 'r-dead' as StableId,
      treasury: -10_000,
      roster: [makeWarrior({ id: 'w-displaced' as WarriorId })],
    });
    const healthy = makeRival({ id: 'r-ok' as StableId, treasury: 5_000, roster: [] });

    const impact = runSystemPass(churnState([bankrupt, healthy]));

    expect(impact.rivalsRemovals).toContain('r-dead');
  });

  it('routes the removed stable roster onto the free-agent shelf', () => {
    const bankrupt = makeRival({
      id: 'r-dead' as StableId,
      treasury: -10_000,
      roster: [makeWarrior({ id: 'w-displaced' as WarriorId })],
    });

    const impact = runSystemPass(churnState([bankrupt]));

    expect((impact.freeAgentAdditions ?? []).map((p) => p.id)).toContain('w-displaced');
  });

  it('keeps rival updates off removed stables and on retained ones', () => {
    const bankrupt = makeRival({ id: 'r-dead' as StableId, treasury: -10_000, roster: [] });
    const healthy = makeRival({ id: 'r-ok' as StableId, treasury: 5_000, roster: [] });

    const impact = runSystemPass(churnState([bankrupt, healthy]));

    // Philosophy/churn updates target the post-churn world — the shuttered
    // stable must not receive updates, and the survivor still gets them.
    expect(impact.rivalsUpdates?.has('r-dead' as StableId)).toBe(false);
    expect(impact.rivalsUpdates?.has('r-ok' as StableId)).toBe(true);
  });

  it('still emits the seasonal summary newsletter with collapse news', () => {
    const bankrupt = makeRival({ id: 'r-dead' as StableId, treasury: -10_000, roster: [] });

    const impact = runSystemPass(churnState([bankrupt]));

    const items = impact.newsletterItems ?? [];
    expect(items.some((n) => (n.items ?? []).some((i) => i.includes('COLLAPSE')))).toBe(true);
  });
});

describe('SystemPass — player roster floor', () => {
  function floorState(): ReturnType<typeof createFreshState> {
    const s = createFreshState('seed-floor');
    s.week = 5;
    s.year = 1;
    s.season = 'Spring';
    s.roster = [];
    s.rivals = [];
    return s;
  }

  it('signs the lowest-tier non-dead pool candidate and drains it by id', () => {
    const state = floorState();
    const dead = makePoolWarrior({ id: 'dead-one', tier: 'Common' });
    const prodigy = makePoolWarrior({ id: 'prodigy-1', tier: 'Prodigy' });
    const common = makePoolWarrior({ id: 'common-1', tier: 'Common' });
    state.recruitPool = [dead, prodigy, common];
    state.deadWarriorIds = ['dead-one' as WarriorId];

    const impact = runSystemPass(state);

    const added = impact.rosterAdditions ?? [];
    expect(added).toHaveLength(1);
    expect(added[0]?.name).toBe(common.name);
    expect(added[0]?.stableId).toBe(state.player.id);

    const poolIds = (impact.recruitPool ?? []).map((w) => w.id);
    expect(poolIds).toContain('prodigy-1');
    expect(poolIds).toContain('dead-one'); // dead stay shelved, just unsigned
    expect(poolIds).not.toContain('common-1');
  });

  it('preserves the veteran snapshot when the floor pick is a displaced veteran', () => {
    const state = floorState();
    const vet = makePoolWarrior({
      id: 'vet-1',
      tier: 'Common',
      veteran: {
        fame: 120,
        popularity: 40,
        career: { wins: 9, losses: 3, kills: 0 },
        titles: ['Regional Champ' as never],
      },
    });
    state.recruitPool = [vet];

    const impact = runSystemPass(state);

    const added = impact.rosterAdditions ?? [];
    expect(added).toHaveLength(1);
    expect(added[0]?.id).toBe('vet-1');
    expect(added[0]?.fame).toBe(120);
    expect(added[0]?.career).toEqual({ wins: 9, losses: 3, kills: 0 });
  });

  it('mints a walk-on through the recruit recipe when the pool is empty', () => {
    const state = floorState();
    state.recruitPool = [];

    const impact = runSystemPass(state);

    const added = impact.rosterAdditions ?? [];
    expect(added).toHaveLength(1);
    expect(added[0]?.stableId).toBe(state.player.id);
  });
});
