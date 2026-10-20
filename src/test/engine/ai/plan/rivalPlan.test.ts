/**
 * Contract tests for `rivalFightPlan` — the shared helper that collapses the
 * grudge-lookup + `aiPlanForWarrior` tail duplicated across `getNPCPlan`,
 * `getAIPlan`, and `agentPlanForWarrior`.
 *
 * Key semantics the helper must preserve:
 *  - grudge intensity comes from `state.grudgeMap` keyed by
 *    `getPairKey(rival.owner.id, opponentId)` — an OWNER-id namespace;
 *  - dossiers live in `rival.agentMemory.opponentDossiers` keyed by the
 *    opponent's STABLE id;
 *  - missing personality/philosophy default to 'Pragmatic'/'Opportunist';
 *  - `now` defaults to `state.absoluteWeek ?? state.week`.
 */
import { describe, it, expect } from 'vitest';
import { rivalFightPlan } from '@/engine/ai/plan/rivalPlan';
import { makeWarrior, makeRival, makeOwner, makeGameState } from '@/test/_fixtures/factories';
import { getPairKey } from '@/utils/keyUtils';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { OwnerGrudge } from '@/types/state/game';
import type { OpponentDossier } from '@/types/state/game';
import type { Warrior } from '@/types/warrior.types';
import type { StableId } from '@/types/shared.types';

const OWNER_ID = 'owner-rival' as StableId;

function baseState(over: Partial<GameState> = {}): GameState {
  return makeGameState({
    week: 10,
    absoluteWeek: 20,
    grudgeMap: new Map<string, OwnerGrudge>(),
    ...over,
  } as Partial<GameState>);
}

function rivalWith(over: Partial<RivalStableData> = {}): RivalStableData {
  return makeRival({
    id: 'st-rival' as StableId,
    owner: makeOwner({ id: OWNER_ID }),
    ...over,
  });
}

const warrior = (): Warrior => makeWarrior({ stableId: 'st-rival' as StableId });

function grudge(intensity: number): OwnerGrudge {
  return {
    id: 'g1' as OwnerGrudge['id'],
    ownerIdA: OWNER_ID,
    ownerIdB: 'owner-opp' as StableId,
    intensity,
    reason: 'test',
    startWeek: 1,
    lastEscalation: 1,
  };
}

describe('rivalFightPlan', () => {
  it('produces a FightPlan using rival defaults for missing personality/philosophy', () => {
    const state = baseState();
    const rival = rivalWith({
      owner: { ...makeOwner({ id: OWNER_ID }), personality: undefined } as never,
      philosophy: undefined,
    });
    const plan = rivalFightPlan(state, warrior(), rival, {});
    const expected = rivalFightPlan(
      state,
      warrior(),
      rivalWith({ owner: makeOwner({ id: OWNER_ID, personality: 'Pragmatic' }) }),
      {}
    );
    expect(plan).toEqual(expected);
    expect(plan.OE).toBeTypeOf('number');
  });

  it('reads grudge intensity from grudgeMap keyed by owner ids', () => {
    const gm = new Map<string, OwnerGrudge>([
      [getPairKey(OWNER_ID, 'owner-opp' as StableId), grudge(3)],
    ]);
    const state = baseState({ grudgeMap: gm });
    const rival = rivalWith();

    const withGrudge = rivalFightPlan(state, warrior(), rival, {
      opponentId: 'owner-opp',
    });
    const baseline = rivalFightPlan(baseState(), warrior(), rival, {
      opponentId: 'owner-opp',
    });

    expect(withGrudge.killDesire).toBeGreaterThan(baseline.killDesire ?? 0);
    expect(withGrudge.AL).toBeGreaterThan(baseline.AL ?? 0);
  });

  it('looks up the dossier by opponentStableId in agentMemory.opponentDossiers', () => {
    const dossier = { lastOutcome: 'Win', rematchNotes: 'x' } as unknown as OpponentDossier;
    const rival = rivalWith({
      agentMemory: { opponentDossiers: { 'st-opp': dossier } } as never,
    });
    const state = baseState();

    const viaStableId = rivalFightPlan(state, warrior(), rival, {
      opponentStableId: 'st-opp',
    });
    const viaExplicit = rivalFightPlan(state, warrior(), rival, { dossier });
    expect(viaStableId).toEqual(viaExplicit);
  });

  it('prefers an explicit dossier over the stableId lookup', () => {
    const dossier = { lastOutcome: 'Loss' } as unknown as OpponentDossier;
    const rival = rivalWith({
      agentMemory: { opponentDossiers: { 'st-opp': {} } } as never,
    });
    const state = baseState();

    const out = rivalFightPlan(state, warrior(), rival, {
      opponentStableId: 'st-opp',
      dossier,
    });
    const expected = rivalFightPlan(state, warrior(), rival, { dossier });
    expect(out).toEqual(expected);
  });

  it('defaults `now` to absoluteWeek ?? week', () => {
    const state = baseState();
    const rival = rivalWith();
    const implicit = rivalFightPlan(state, warrior(), rival, {});
    const explicit = rivalFightPlan(state, warrior(), rival, { now: 20 });
    expect(implicit).toEqual(explicit);
  });
});
