/**
 * Bounded second negotiation round (Stage C). The first counter is
 * `evaluateBoutOffer`'s job; when the OTHER side's re-evaluation on a
 * countered offer is itself a counter, `resolveSecondRound` decides
 * whether that escalation stands (round 0 → 1) or the stable walks.
 * One escalation total — after `negotiationRound` reaches 1 the offer is
 * take-it-or-leave-it, so the loop can never spin.
 */
import type { BoutOffer, RivalStableData } from '@/types/state.types';
import type { OwnerPersonality } from '@/types/state.types';

/** Counter verdicts `evaluateBoutOffer` can return. */
export type CounterVerdict = 'Countered' | 'CounteredVenue';
/** Full verdict space `evaluateBoutOffer` may return. */
export type BoutVerdict = 'Accepted' | 'Declined' | CounterVerdict;

/** Result of an offer evaluation: the verdict plus an optional walk reason. */
export interface NegotiationOutcome {
  final: BoutVerdict;
  /** Persisted to `responseNotes` when the stable walks. */
  reason?: string;
}

/**
 * How much escalation a personality tolerates before walking, 0..1.
 * Aggressive owners take or leave; Showmen haggle longest.
 */
export function walkAwayTolerance(personality: OwnerPersonality | undefined): number {
  switch (personality) {
    case 'Aggressive':
      return 0.1;
    case 'Methodical':
      return 0.3;
    case 'Pragmatic':
      return 0.5;
    case 'Tactician':
      return 0.5;
    case 'Showman':
      return 0.8;
    default:
      return 0.4;
  }
}

/** Below this tolerance a stable never escalates — it walks on sight. */
const ESCALATION_FLOOR = 0.25;

/**
 * Resolve a second-round counter verdict on an already-countered offer.
 * Round 0 with a tolerant personality lets the escalation stand (the
 * verdict is returned so the caller can stamp it); anything else — a
 * consumed round or a walk-away personality — declines with a reason.
 */
export function resolveSecondRound(
  offer: BoutOffer,
  verdict: BoutVerdict,
  rival: RivalStableData
): NegotiationOutcome {
  if (verdict !== 'Countered' && verdict !== 'CounteredVenue') return { final: verdict };

  const round = offer.negotiationRound ?? 0;
  if (round >= 1) {
    return { final: 'Declined', reason: 'negotiation-exhausted' };
  }

  const tolerance = walkAwayTolerance(rival.owner.personality);
  if (tolerance < ESCALATION_FLOOR) {
    return { final: 'Declined', reason: 'walked-away' };
  }

  return { final: verdict };
}
