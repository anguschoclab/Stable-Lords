// @vitest-environment node
/**
 * Stage D — plan masking. Deceptive stables (Tactician/Methodical) commit a
 * decoy `w.plan` at signing — that's the artifact Expert scouting reads —
 * while `planMasked` forces bout resolution to recompute the real plan.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { persistNPCPlans, agentPlanForWarrior } from '@/engine/ai/plan/agentPlan';
import { getNPCPlan } from '@/engine/bout/services/boutResolution';
import { generateScoutReport } from '@/engine/scouting/scouting';
import { SeededRNGService } from '@/utils/random';
import {
  makeWarrior,
  makeRival,
  makeOwner,
  makeGameState,
  makeBoutOffer,
  resetFixtureIds,
} from '@/test/_fixtures/factories';

beforeEach(() => resetFixtureIds());

function signedOfferFor(proposerId: string, aId: string, dId: string) {
  return makeBoutOffer({
    warriorIds: [aId as never, dId as never],
    proposerStableId: proposerId as never,
    status: 'Signed',
    responses: { [aId]: 'Accepted', [dId]: 'Accepted' } as never,
  });
}

function setup(personality: 'Tactician' | 'Methodical' | 'Pragmatic') {
  const npcW = makeWarrior({ id: 'nw' as never, fame: 80 });
  const oppW = makeWarrior({ id: 'ow' as never, fame: 60 });
  const rival = makeRival({
    id: 'r-mask' as never,
    owner: makeOwner({ id: 'r-mask' as never, personality }),
    roster: [npcW],
  });
  const oppRival = makeRival({
    id: 'r-opp' as never,
    owner: makeOwner({ id: 'r-opp' as never }),
    roster: [oppW],
  });
  const state = makeGameState({ rivals: [rival, oppRival] });
  const offer = signedOfferFor(rival.id as string, npcW.id as string, oppW.id as string);
  return { npcW, oppW, rival, oppRival, state, offer };
}

describe('persistNPCPlans — masking', () => {
  it('Tactician stables commit a masked decoy, not the real plan', () => {
    const { npcW, oppW, rival, oppRival, state, offer } = setup('Tactician');
    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const written = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;

    const real = agentPlanForWarrior(rival, npcW, oppW, state, oppRival.id as string);
    expect(written.planMasked).toBe(true);
    expect(written.plan!.OE).not.toBe(real.OE);
    // Decoy inverts the effort axes so scouts read the opposite tendency.
    expect(written.plan!.OE).toBe(11 - real.OE!);
    expect(written.plan!.AL).toBe(11 - real.AL!);
  });

  it('Pragmatic stables commit the real plan unmasked', () => {
    const { npcW, oppW, rival, oppRival, state, offer } = setup('Pragmatic');
    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const written = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;
    const real = agentPlanForWarrior(rival, npcW, oppW, state, oppRival.id as string);
    expect(written.planMasked).toBeFalsy();
    expect(written.plan!.OE).toBe(real.OE);
  });
});

describe('getNPCPlan — masked-plan recompute guard', () => {
  it('a masked plan is never honored verbatim — resolution recomputes', () => {
    const { npcW, oppW, rival, oppRival, state, offer } = setup('Tactician');
    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const updatedRival = updated.find((r) => r.id === rival.id)!;
    const maskedW = updatedRival.roster.find((w) => w.id === npcW.id)!;
    expect(maskedW.planMasked).toBe(true);

    const resState = makeGameState({ rivals: [updatedRival, oppRival] });
    const plan = getNPCPlan(resState, maskedW, oppW.style, 'player-1', oppRival.id as string);
    // The decoy's inverted OE must not leak into resolution.
    expect(plan.OE).not.toBe(maskedW.plan!.OE);
    expect(plan).not.toBe(maskedW.plan);
  });
});

describe('scouting — decoy visibility', () => {
  it('Expert scouting reports the masked decoy tendencies', () => {
    const { npcW, oppW, rival, oppRival, state, offer } = setup('Tactician');
    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const maskedW = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;
    const real = agentPlanForWarrior(rival, npcW, oppW, state, oppRival.id as string);

    const { report } = generateScoutReport(maskedW, 'Expert', 5, new SeededRNGService(7));
    const decoyOE = maskedW.plan!.OE!;
    const decoyBand = decoyOE >= 7 ? 'High' : decoyOE >= 4 ? 'Medium' : 'Low';
    // The scout reads the committed decoy, not the true plan.
    expect(report.suspectedOE).toBe(decoyBand);
    expect(maskedW.plan!.OE).toBe(11 - real.OE!);
  });
});
