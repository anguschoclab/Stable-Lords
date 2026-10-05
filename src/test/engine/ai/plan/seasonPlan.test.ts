/**
 * Stage C — season plan-of-record. `pickSeasonObjective` chooses one
 * strategic objective per ~quarter above the weekly intent cascade:
 * CROWN when a throne assessment is live, REBUILD when the roster or
 * treasury can't sustain campaigning, TREASURY when the stable can bank.
 * `applySeasonPlan` ticks the objective weekly and re-picks on expiry;
 * `objectiveStillViable` feeds the skepticism tier so a disproved
 * objective forces a re-plan rather than limping on.
 */
import { describe, it, expect } from 'vitest';
import {
  pickSeasonObjective,
  applySeasonPlan,
  objectiveStillViable,
  SEASON_OBJECTIVE_WEEKS,
} from '@/engine/ai/plan/seasonPlan';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeAgentMemory,
} from '@/test/_fixtures/factories';

const crownRival = () => {
  const w = makeWarrior({ id: 'w-crown' as never });
  return makeRival({
    treasury: 3000,
    roster: [w],
    agentMemory: makeAgentMemory({
      crownAssessment: { arenaId: 'arena_a', warriorId: w.id, score: 6, reason: 'Winnable throne' },
    }),
  });
};

describe('pickSeasonObjective', () => {
  it('a live crown assessment yields a CROWN objective pinned to that arena', () => {
    const rival = crownRival();
    const obj = pickSeasonObjective(rival, makeGameState({ rivals: [rival] }));
    expect(obj?.kind).toBe('CROWN');
    expect(obj?.targetArenaId).toBe('arena_a');
    expect(obj?.weeksRemaining).toBeGreaterThan(0);
  });

  it('a cash-poor stable cannot campaign — REBUILD beats CROWN', () => {
    const w = makeWarrior({ id: 'w-poor' as never });
    const rival = makeRival({
      treasury: 100,
      roster: [w],
      agentMemory: makeAgentMemory({
        crownAssessment: { arenaId: 'arena_a', warriorId: w.id, score: 6, reason: 'Winnable' },
      }),
    });
    const obj = pickSeasonObjective(rival, makeGameState({ rivals: [rival] }));
    expect(obj?.kind).toBe('REBUILD');
  });

  it('a rich stable with no crown path banks — TREASURY', () => {
    const rival = makeRival({
      treasury: 8000,
      roster: [makeWarrior()],
      agentMemory: makeAgentMemory(),
    });
    const obj = pickSeasonObjective(rival, makeGameState({ rivals: [rival] }));
    expect(obj?.kind).toBe('TREASURY');
    expect(obj?.treasuryTarget).toBeGreaterThan(rival.treasury);
  });

  it('is deterministic — same inputs, same objective', () => {
    const rival = crownRival();
    const state = makeGameState({ rivals: [rival] });
    expect(pickSeasonObjective(rival, state)).toEqual(pickSeasonObjective(rival, state));
  });
});

describe('applySeasonPlan — weekly tick', () => {
  it('writes a fresh objective when none exists, with a full runway', () => {
    const rival = crownRival();
    const out = applySeasonPlan(rival, makeGameState({ rivals: [rival] }));
    expect(out.agentMemory?.seasonObjective?.kind).toBe('CROWN');
    expect(out.agentMemory?.seasonObjective?.weeksRemaining).toBe(SEASON_OBJECTIVE_WEEKS);
  });

  it('ticks the runway down by one each week', () => {
    const rival = crownRival();
    rival.agentMemory!.seasonObjective = {
      kind: 'CROWN',
      targetArenaId: 'arena_a',
      weeksRemaining: 7,
      reason: 'test',
    };
    const out = applySeasonPlan(rival, makeGameState({ rivals: [rival] }));
    expect(out.agentMemory?.seasonObjective?.weeksRemaining).toBe(6);
    expect(out.agentMemory?.seasonObjective?.targetArenaId).toBe('arena_a');
  });

  it('re-picks when the runway expires', () => {
    const rival = crownRival();
    rival.agentMemory!.seasonObjective = {
      kind: 'TREASURY',
      treasuryTarget: 99999,
      weeksRemaining: 1,
      reason: 'stale',
    };
    const out = applySeasonPlan(rival, makeGameState({ rivals: [rival] }));
    // Fresh objective — the stale TREASURY plan is replaced by the live CROWN one.
    expect(out.agentMemory?.seasonObjective?.kind).toBe('CROWN');
  });
});

describe('objectiveStillViable', () => {
  it('a CROWN objective dies with its campaign warrior', () => {
    const rival = crownRival();
    rival.agentMemory!.seasonObjective = {
      kind: 'CROWN',
      targetArenaId: 'arena_a',
      weeksRemaining: 10,
      reason: 'test',
    };
    const state = makeGameState({ rivals: [rival] });
    expect(objectiveStillViable(rival, state)).toBe(true);

    // Campaign warrior leaves the roster.
    const dead = { ...rival, roster: [] };
    expect(objectiveStillViable(dead, state)).toBe(false);
  });

  it('no objective is trivially viable — the weekly cascade owns the week', () => {
    const rival = makeRival({ agentMemory: makeAgentMemory() });
    expect(objectiveStillViable(rival, makeGameState())).toBe(true);
  });
});
