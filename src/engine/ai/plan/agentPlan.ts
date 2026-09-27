/**
 * Agent plan persistence (G8/G11).
 *
 * When a rival warrior signs a bout, the stable's tactical staff commits a
 * fight plan for that specific opponent — `w.plan` + `planWeek` +
 * `planForStableId` are written onto the roster entry. This makes NPC plans
 * observable (Expert scouting reads `w.plan`) and gives rematch adaptation
 * something real to adapt with.
 */
import type { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import { aiPlanForWarrior } from './coreGenerator';
import { getPairKey } from '@/utils/keyUtils';
import { isActive } from '@/engine/warriorStatus';
import { clamp } from '@/utils/math';

/**
 * Compute the plan an NPC stable commits for `w` against `opponent`.
 * Pulls the stable's dossier on the opponent's stable for rematch deltas.
 */
export function agentPlanForWarrior(
  rival: RivalStableData,
  w: Warrior,
  opponent: Warrior,
  state: GameState,
  opponentStableId?: string
): FightPlan {
  const resolvedOpponentStable =
    opponentStableId ??
    (opponent.stableId as string | undefined) ??
    state.warriorToStableMap?.get(opponent.id)?.stableId;
  const dossier = resolvedOpponentStable
    ? rival.agentMemory?.opponentDossiers?.[resolvedOpponentStable]
    : undefined;

  const grudge = state.grudgeMap?.get(
    getPairKey(rival.owner.id, resolvedOpponentStable ?? '')
  );

  return aiPlanForWarrior(
    w,
    rival.owner.personality ?? 'Pragmatic',
    rival.philosophy ?? 'Opportunist',
    opponent.style,
    rival.strategy?.intent,
    grudge?.intensity ?? 0,
    dossier,
    state.absoluteWeek ?? state.week
  );
}

/** Owners who scout well also deceive well — their committed plans are decoys. */
const DECEPTIVE_PERSONALITIES = new Set(['Tactician', 'Methodical']);

/**
 * Invert the effort axes into a credible-looking decoy. The masked plan is
 * the scouting artifact Expert reports read; `planMasked` guarantees bout
 * resolution recomputes the real plan rather than fighting the decoy.
 */
function decoyPlan(plan: FightPlan): FightPlan {
  return {
    ...plan,
    OE: clamp(11 - (plan.OE ?? 5), 1, 10),
    AL: clamp(11 - (plan.AL ?? 5), 1, 10),
    killDesire: clamp(11 - (plan.killDesire ?? 5), 1, 10),
  };
}

/**
 * Write committed plans onto rival warriors whose bouts are Signed.
 * Only 'Signed' offers persist a plan — a proposed bout has no commitment
 * yet, and a stale plan for a different opponent is never reused.
 * Tactician/Methodical stables write a masked decoy (`planMasked`): scouts
 * read the decoy, resolution recomputes the real plan.
 */
export function persistNPCPlans(
  rivals: RivalStableData[],
  signedOffers: BoutOffer[],
  state: GameState
): RivalStableData[] {
  const week = state.absoluteWeek ?? state.week;

  // stableId → warriorId → { opponentId, opponentStableId } needing plans
  const commitments = new Map<
    string,
    Map<string, { opponentId: string; opponentStableId: string }>
  >();
  const addCommitment = (
    stableId: string,
    warriorId: string,
    opponentId: string,
    opponentStableId: string
  ) => {
    let inner = commitments.get(stableId);
    if (!inner) commitments.set(stableId, (inner = new Map()));
    inner.set(warriorId, { opponentId, opponentStableId });
  };
  for (const offer of signedOffers) {
    if (offer.status !== 'Signed' || offer.warriorIds.length < 2) continue;
    const [aId, dId] = offer.warriorIds;
    if (!aId || !dId) continue;
    const aStable = state.warriorToStableMap?.get(aId)?.stableId;
    const dStable = state.warriorToStableMap?.get(dId)?.stableId;
    if (aStable && aStable !== state.player.id && dStable) {
      addCommitment(aStable, aId as string, dId as string, dStable);
    }
    if (dStable && dStable !== state.player.id && aStable) {
      addCommitment(dStable, dId as string, aId as string, aStable);
    }
  }
  if (commitments.size === 0) return rivals;

  return rivals.map((rival) => {
    const needed = commitments.get(rival.id as string) ?? commitments.get(rival.owner.id);
    if (!needed || needed.size === 0) return rival;

    let changed = false;
    const roster = rival.roster.map((w) => {
      const commitment = needed.get(w.id as string);
      if (!commitment || !isActive(w)) return w;
      const opponent = state.warriorMap?.get(commitment.opponentId as never);
      if (!opponent) return w;
      changed = true;
      const real = agentPlanForWarrior(rival, w, opponent, state, commitment.opponentStableId);
      const masked = DECEPTIVE_PERSONALITIES.has(rival.owner.personality ?? '');
      return {
        ...w,
        plan: masked ? decoyPlan(real) : real,
        planWeek: week,
        planForStableId: commitment.opponentStableId,
        planMasked: masked || undefined,
      };
    });
    return changed ? { ...rival, roster } : rival;
  });
}
