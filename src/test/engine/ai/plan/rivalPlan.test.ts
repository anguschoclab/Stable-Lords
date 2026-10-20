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

function dossier(over: Partial<OpponentDossier> = {}): OpponentDossier {
  return {
    lastSeenWeek: 1,
    knownStyles: [],
    estimatedThreat: 0.5,
    recordVs: { w: 0, l: 0, k: 0 },
    ...over,
  } as OpponentDossier;
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
    // grudgeMap is rebuilt from ownerGrudges — the same wiring the week
    // pipeline performs in buildWeekCaches.
    const state = baseState({ ownerGrudges: [grudge(3)] } as Partial<GameState>);
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
    // A losing record shifts rematch axes — proving the dossier was read.
    const d = dossier({ recordVs: { w: 0, l: 4, k: 1 } });
    const rival = rivalWith({
      agentMemory: { opponentDossiers: { 'st-opp': d } } as never,
    });
    const state = baseState();

    const viaStableId = rivalFightPlan(state, warrior(), rival, {
      opponentStableId: 'st-opp',
    });
    const noDossier = rivalFightPlan(state, warrior(), rival, {});
    expect(viaStableId.AL).toBeGreaterThan(noDossier.AL ?? 0);
    expect(viaStableId.killDesire).toBeGreaterThan(noDossier.killDesire ?? 0);
  });

  it('prefers an explicit dossier over the stableId lookup', () => {
    const explicit = dossier({ recordVs: { w: 4, l: 0, k: 0 } });
    const rival = rivalWith({
      agentMemory: {
        opponentDossiers: { 'st-opp': dossier({ recordVs: { w: 0, l: 4, k: 0 } }) },
      } as never,
    });
    const state = baseState();

    const out = rivalFightPlan(state, warrior(), rival, {
      opponentStableId: 'st-opp',
      dossier: explicit,
    });
    const expected = rivalFightPlan(state, warrior(), rival, { dossier: explicit });
    expect(out).toEqual(expected);
  });

  it('resolves a rival opponentStableId to its owner id for the grudge lookup (F-bug)', () => {
    // The caller supplies the opponent's STABLE id; the grudge lives under
    // the opponent's OWNER id. The helper must bridge the two namespaces.
    const oppRival = makeRival({
      id: 'st-opp' as StableId,
      owner: makeOwner({ id: 'owner-opp' as StableId }),
    });
    const state = baseState({
      ownerGrudges: [grudge(3)],
      rivals: [oppRival],
    } as Partial<GameState>);
    const rival = rivalWith();

    const viaStable = rivalFightPlan(state, warrior(), rival, {
      opponentStableId: 'st-opp',
    });
    const baseline = rivalFightPlan(
      baseState({ rivals: [oppRival] } as Partial<GameState>),
      warrior(),
      rival,
      { opponentStableId: 'st-opp' }
    );

    expect(viaStable.killDesire).toBeGreaterThan(baseline.killDesire ?? 0);
    expect(viaStable.AL).toBeGreaterThan(baseline.AL ?? 0);
  });

  it('does not let a caller-supplied opponentId shadow the stable-resolved owner (F-bug)', () => {
    // Regression: boutResolution historically passed state.player.id as the
    // grudge key even for rival-vs-rival bouts — a rival's grudge against
    // the player leaked into plans against unrelated rivals. The stable id
    // identifies the actual opponent and must win.
    const oppRival = makeRival({
      id: 'st-opp' as StableId,
      owner: makeOwner({ id: 'owner-opp' as StableId }),
    });
    const state = baseState();
    const playerGrudge: OwnerGrudge = {
      id: 'g2' as OwnerGrudge['id'],
      ownerIdA: OWNER_ID,
      ownerIdB: state.player.id,
      intensity: 5,
      reason: 'test',
      startWeek: 1,
      lastEscalation: 1,
    };
    const withPlayerGrudge = baseState({
      ownerGrudges: [playerGrudge],
      rivals: [oppRival],
    } as Partial<GameState>);
    const rival = rivalWith();

    // Even with opponentId = player.id (the old bout call-site shape), the
    // plan must reflect the stable-resolved opponent — no player grudge.
    const plan = rivalFightPlan(withPlayerGrudge, warrior(), rival, {
      opponentId: state.player.id,
      opponentStableId: 'st-opp',
    });
    const clean = rivalFightPlan(
      baseState({ rivals: [oppRival] } as Partial<GameState>),
      warrior(),
      rival,
      { opponentStableId: 'st-opp' }
    );
    expect(plan).toEqual(clean);
  });

  it('keeps the player path: an unresolved stable id is itself the owner key', () => {
    // Player warriors' stableId equals state.player.id — the id grudges are
    // stored under — and is absent from rivalMap, so it falls through.
    const state = baseState();
    const playerGrudge: OwnerGrudge = {
      id: 'g3' as OwnerGrudge['id'],
      ownerIdA: OWNER_ID,
      ownerIdB: state.player.id,
      intensity: 4,
      reason: 'test',
      startWeek: 1,
      lastEscalation: 1,
    };
    const withGrudge = baseState({ ownerGrudges: [playerGrudge] } as Partial<GameState>);
    const rival = rivalWith();

    const viaStable = rivalFightPlan(withGrudge, warrior(), rival, {
      opponentStableId: state.player.id,
    });
    const baseline = rivalFightPlan(baseState(), warrior(), rival, {
      opponentStableId: state.player.id,
    });
    expect(viaStable.killDesire).toBeGreaterThan(baseline.killDesire ?? 0);
  });

  it('defaults `now` to absoluteWeek ?? week', () => {
    const state = baseState();
    const rival = rivalWith();
    const implicit = rivalFightPlan(state, warrior(), rival, {});
    const explicit = rivalFightPlan(state, warrior(), rival, { now: 20 });
    expect(implicit).toEqual(explicit);
  });
});
