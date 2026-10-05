/**
 * Stage C — bounded second negotiation round. Today a countered offer is
 * take-it-or-leave-it (`resolveCounteredOffers` maps a second counter
 * verdict straight to Declined). The new rule: one escalation is allowed
 * (`negotiationRound` 0 → 1), gated by personality — walk-away tolerance
 * is Aggressive < Methodical < Pragmatic/Tactician < Showman. After the
 * single escalation the offer is final; counter-decline carries a reason
 * for `responseNotes`.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveSecondRound,
  walkAwayTolerance,
  type NegotiationOutcome,
} from '@/engine/ai/workers/competitionWorker/negotiation';
import { BoutOfferSchema } from '@/schemas/fightSchemas';
import { makeBoutOffer, makeRival, makeOwner } from '@/test/_fixtures/factories';
import type { OwnerPersonality } from '@/types/state.types';

const rivalWith = (personality: OwnerPersonality) =>
  makeRival({ owner: makeOwner({ personality }) });

describe('walkAwayTolerance ordering', () => {
  it('Aggressive walks earliest, Showman latest', () => {
    expect(walkAwayTolerance('Aggressive')).toBeLessThan(walkAwayTolerance('Methodical'));
    expect(walkAwayTolerance('Methodical')).toBeLessThan(walkAwayTolerance('Pragmatic'));
    expect(walkAwayTolerance('Pragmatic')).toBeLessThanOrEqual(walkAwayTolerance('Tactician'));
    expect(walkAwayTolerance('Tactician')).toBeLessThan(walkAwayTolerance('Showman'));
  });
});

describe('resolveSecondRound', () => {
  const counterOffer = (round = 0) =>
    makeBoutOffer({ negotiationRound: round, status: 'Proposed' });

  it('round 0 + counter verdict + tolerant personality → escalation stands', () => {
    const out: NegotiationOutcome = resolveSecondRound(
      counterOffer(0),
      'CounteredVenue',
      rivalWith('Showman')
    );
    expect(out.final).toBe('CounteredVenue');
  });

  it('round 1 → take it or leave it (the loop is bounded)', () => {
    const out = resolveSecondRound(counterOffer(1), 'CounteredVenue', rivalWith('Showman'));
    expect(out.final).not.toBe('CounteredVenue');
    expect(out.final).not.toBe('Countered');
  });

  it('Aggressive walks on round 0 where a Showman escalates', () => {
    expect(
      resolveSecondRound(counterOffer(0), 'CounteredVenue', rivalWith('Aggressive')).final
    ).toBe('Declined');
    expect(
      resolveSecondRound(counterOffer(0), 'CounteredVenue', rivalWith('Showman')).final
    ).toBe('CounteredVenue');
  });

  it('a walk-away decline carries a reason for responseNotes', () => {
    const out = resolveSecondRound(counterOffer(1), 'Countered', rivalWith('Pragmatic'));
    expect(out.final).toBe('Declined');
    expect(out.reason).toBeTruthy();
  });
});

describe('negotiationRound schema', () => {
  it('round-trips through BoutOfferSchema', () => {
    const offer = makeBoutOffer({ negotiationRound: 1 });
    const parsed = BoutOfferSchema.parse(offer);
    expect(parsed.negotiationRound).toBe(1);
  });
});
