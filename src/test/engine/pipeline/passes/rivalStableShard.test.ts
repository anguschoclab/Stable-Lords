/**
 * rivalStableShard — STRATEGY audit trail.
 * processRivalStable must log a STRATEGY action event exactly when
 * updateAIStrategy issues a fresh plan (no plan, expired plan, or a plan
 * disproved by reality) — and never on a plain weekly tick. Regression for
 * the year-audit finding that 0 STRATEGY events existed despite weekly
 * strategy churn.
 */
import { describe, it, expect } from 'vitest';
import {
  processRivalStable,
  buildSuccessorIndex,
  type RivalShardContext,
} from '@/engine/pipeline/passes/rivalStableShard';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeRival } from '@/test/_fixtures/factories';
import type { GameState } from '@/types/state.types';

function makeCtx(state: GameState): RivalShardContext {
  return {
    state,
    perception: buildPerceptionSnapshot(state),
    successorByStable: buildSuccessorIndex([]),
    nextWeek: state.week + 1,
  };
}

describe('processRivalStable — STRATEGY audit events', () => {
  it('logs STRATEGY when a fresh plan is issued (no prior strategy)', () => {
    const state = createFreshState('strategy-issue');
    state.week = 5;
    state.absoluteWeek = 5;
    const rival = makeRival({ strategy: undefined });
    state.rivals = [rival];

    const { rival: out } = processRivalStable({ rival, index: 0 }, makeCtx(state));

    const stratEvents = (out.actionHistory ?? []).filter((e) => e.type === 'STRATEGY');
    expect(stratEvents).toHaveLength(1);
    expect(stratEvents[0]!.cause).toBe(out.strategy!.intent);
    expect(stratEvents[0]!.description).toBe(out.strategy!.reason);
  });

  it('does NOT log STRATEGY on a plain weekly tick of a valid plan', () => {
    const state = createFreshState('strategy-tick');
    state.week = 5;
    state.absoluteWeek = 5;
    // CONSOLIDATION never gets disproved (verifyIntentSkepticism returns false
    // for it) — with planWeeksRemaining > 0 this must take the tick path.
    const rival = makeRival({
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 3 },
    });
    state.rivals = [rival];

    const { rival: out } = processRivalStable({ rival, index: 0 }, makeCtx(state));

    expect(out.strategy!.planWeeksRemaining).toBe(2);
    expect((out.actionHistory ?? []).some((e) => e.type === 'STRATEGY')).toBe(false);
  });

  it('logs STRATEGY when a disproved plan is replaced by a SHORTER one', () => {
    // Regression: detecting issuance via planWeeksRemaining deltas misses
    // e.g. VENDETTA(6) → RECOVERY(2), because 2 < 5. Issuance must be gated
    // on updateAIStrategy's actual re-pick predicate instead.
    const state = createFreshState('strategy-disproved');
    state.week = 5;
    state.absoluteWeek = 5;
    const rival = makeRival({
      // Disproved: VENDETTA with no grudge, no player target, and a
      // targetStableId that exists nowhere.
      strategy: {
        intent: 'VENDETTA',
        planWeeksRemaining: 5,
        targetStableId: 'ghost-stable' as never,
      },
    });
    state.rivals = [rival];

    const { rival: out } = processRivalStable({ rival, index: 0 }, makeCtx(state));

    const stratEvents = (out.actionHistory ?? []).filter((e) => e.type === 'STRATEGY');
    expect(stratEvents).toHaveLength(1);
    expect(stratEvents[0]!.cause).toBe(out.strategy!.intent);
  });
});
