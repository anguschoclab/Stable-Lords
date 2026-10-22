import { describe, it, expect } from 'vitest';
import { applyCouncilPlan } from '@/engine/advisor/applyCouncilPlan';
import type { StableCouncilReport } from '@/engine/advisor/types';
import { makeGameState, makeWarrior, makeBoutOffer } from '@/test/_fixtures/factories';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

/**
 * Characterization pins for applyCouncilPlan — the payload loop that hoists
 * per-payload training-assignment filters and roster finds into shared
 * indexes. Pins the batch-visible semantics, not the internals.
 */
function reportWith(payloads: StableCouncilReport['summary']['allActionPayloads']) {
  return { summary: { allActionPayloads: payloads } } as StableCouncilReport;
}

describe('applyCouncilPlan', () => {
  const w1 = makeWarrior({ id: 'w1' as WarriorId });
  const w2 = makeWarrior({ id: 'w2' as WarriorId });

  function stateWith() {
    return makeGameState({
      roster: [w1, w2],
      trainingAssignments: [
        { warriorId: 'w1' as WarriorId, type: 'attribute', attribute: 'ST' },
        { warriorId: 'w2' as WarriorId, type: 'recovery' },
      ],
      boutOffers: {
        ['o1' as BoutOfferId]: makeBoutOffer({
          id: 'o1' as BoutOfferId,
          status: 'Proposed',
          warriorIds: ['w2' as WarriorId, 'rw1' as WarriorId],
          responses: { w2: 'Pending', rw1: 'Accepted' } as any,
        }),
      },
    });
  }

  it('replaces an existing assignment and clears stale ones — batched', () => {
    const state = stateWith();
    const next = applyCouncilPlan(
      state,
      reportWith([
        {
          warriorId: 'w1' as WarriorId,
          trainingAssignment: { warriorId: 'w1' as WarriorId, type: 'skillDrill' } as any,
        },
        // w2's payload carries no assignment → its stale 'recovery' clears.
        { warriorId: 'w2' as WarriorId },
      ])
    );
    const byWarrior = new Map(
      (next.trainingAssignments ?? []).map((a) => [a.warriorId as string, a.type])
    );
    expect(byWarrior.get('w1')).toBe('skillDrill');
    expect(byWarrior.has('w2')).toBe(false);
  });

  it('accepts a proposed offer and applies the plan patch in the same pass', () => {
    const state = stateWith();
    const next = applyCouncilPlan(
      state,
      reportWith([
        {
          warriorId: 'w2' as WarriorId,
          boutOfferIdToAccept: 'o1' as BoutOfferId,
          tacticsPlanPatch: { OE: 8 },
        },
      ])
    );
    expect(next.boutOffers['o1' as BoutOfferId]!.responses['w2' as WarriorId]).toBe('Accepted');
    // Both parties responded non-Pending and none declined → Signed.
    expect(next.boutOffers['o1' as BoutOfferId]!.status).toBe('Signed');
    expect(next.roster.find((w) => w.id === 'w2')!.plan?.OE).toBe(8);
  });

  it('does not touch offers that are not Proposed', () => {
    const state = stateWith();
    state.boutOffers['o1' as BoutOfferId] = {
      ...state.boutOffers['o1' as BoutOfferId]!,
      status: 'Signed',
    };
    const next = applyCouncilPlan(
      state,
      reportWith([{ warriorId: 'w2' as WarriorId, boutOfferIdToAccept: 'o1' as BoutOfferId }])
    );
    expect(next.boutOffers['o1' as BoutOfferId]!.responses['w2' as WarriorId]).toBe('Pending');
  });
});
