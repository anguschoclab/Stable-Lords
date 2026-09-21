/**
 * E.0 — NPC plan persistence (G8).
 * NPC warriors in signed bouts get `w.plan` computed and persisted (tagged
 * `planWeek` + `planForStableId`); bout resolution prefers a fresh persisted
 * plan; a stale or opponent-mismatched plan is recomputed.
 */
import { describe, it, expect } from 'vitest';
import { persistNPCPlans } from '@/engine/ai/plan/agentPlan';
import { getNPCPlan } from '@/engine/bout/services/boutResolution';
import {
  makeGameState,
  makeRival,
  makeWarrior,
  makeBoutOffer,
} from '@/test/_fixtures/factories';

function signedOfferFor(proposerId: string, aId: string, dId: string) {
  return makeBoutOffer({
    warriorIds: [aId as never, dId as never],
    proposerStableId: proposerId as never,
    status: 'Signed',
    responses: { [aId]: 'Accepted', [dId]: 'Accepted' } as never,
  });
}

describe('NPC plan persistence', () => {
  it('writes w.plan tagged with planWeek + planForStableId for signed-bout warriors', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });
    const offer = signedOfferFor(rival.id as string, npcW.id as string, oppW.id as string);

    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const written = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;

    expect(written.plan).toBeDefined();
    expect(written.planWeek).toBe(state.absoluteWeek ?? state.week);
    expect(written.planForStableId).toBe(oppRival.id);
  });

  it('getNPCPlan prefers a fresh persisted plan over recompute', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });
    const offer = signedOfferFor(rival.id as string, npcW.id as string, oppW.id as string);

    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const persisted = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;

    const stateWithPersisted = makeGameState({
      rivals: [updated.find((r) => r.id === rival.id)!, oppRival],
    });
    const plan = getNPCPlan(stateWithPersisted, persisted, oppW.style, 'player-1');
    // Same object — the persisted plan is used verbatim
    expect(plan).toBe(persisted.plan);
  });

  it('a stale plan (prior week) is recomputed, not reused', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });

    const stalePlanned = {
      ...npcW,
      plan: { OE: 1, AL: 1, killDesire: 1 } as never,
      planWeek: (state.absoluteWeek ?? state.week) - 1,
      planForStableId: oppRival.id,
    };
    const plan = getNPCPlan(state, stalePlanned as never, oppW.style, 'player-1');
    expect(plan).not.toEqual({ OE: 1, AL: 1, killDesire: 1 });
  });

  it('a plan for a different opponent is recomputed', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });

    const mismatched = {
      ...npcW,
      plan: { OE: 1, AL: 1, killDesire: 1 } as never,
      planWeek: state.absoluteWeek ?? state.week,
      planForStableId: 'some-other-stable',
    };
    const plan = getNPCPlan(state, mismatched as never, oppW.style, 'player-1');
    expect(plan).not.toEqual({ OE: 1, AL: 1, killDesire: 1 });
  });

  it('proposed (unsigned) offers do not write plans', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });
    const offer = makeBoutOffer({
      warriorIds: [npcW.id as never, oppW.id as never],
      status: 'Proposed',
    });

    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const written = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;
    expect(written.plan).toBeUndefined();
  });
});
