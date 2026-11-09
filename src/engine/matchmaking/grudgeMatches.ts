import type { BoutOffer, GameState, TournamentBout, TournamentEntry } from '@/types/state.types';
import type { BoutOfferId, PromoterId, TournamentId, WarriorId } from '@/types/shared.types';
import { TOURNAMENT_CLASSES } from './tournamentSelection/classes';

/** Grudge-match promoter — the arena office booking exhibition rematches. */
const GRUDGE_MATCHMAKING = 'GRUDGE_MATCHMAKING' as PromoterId;

/**
 * Grudge matches — post-tournament exhibition bouts (V27, Phase 10).
 *
 * For every non-consolation bracket bout in a completed class tournament,
 * the loser may call out the warrior who eliminated them: a rematch filed as
 * an ordinary week-T+1 bout offer (+1 FE on resolution) that flows through
 * the standard offer/acceptance lane. Deduped to ≤1 grudge per warrior.
 *
 * The rule is symmetric; the chooser differs — this function auto-files
 * rival-owned losers only (the AI's standing decision), while player-owned
 * losses surface as manual call-outs via `fileGrudgeCallout`.
 */
export function buildGrudgeOffers(
  state: GameState,
  tournamentId: TournamentId
): BoutOffer[] {
  const tour = (state.tournaments ?? []).find((t) => t.id === tournamentId);
  if (!tour || !tour.completed) return [];

  const playerIds = new Set(state.roster.map((w) => w.id));
  const booked = new Set<WarriorId>();
  const offers: BoutOffer[] = [];

  for (const bout of tour.bracket) {
    if (bout.isBronzeMatch || !bout.winner) continue;
    const loserId = (bout.winner === 'A' ? bout.warriorIdD : bout.warriorIdA) as WarriorId;
    const killerId = (bout.winner === 'A' ? bout.warriorIdA : bout.warriorIdD) as WarriorId;
    if (!loserId || !killerId || booked.has(loserId) || booked.has(killerId)) continue;
    if (playerIds.has(loserId)) continue; // player calls out manually
    booked.add(loserId);
    booked.add(killerId);
    offers.push(makeGrudgeOffer(state, tour, bout, loserId, killerId));
  }

  // Stablemate-killer lane: a rival victim's rematch always books their
  // killer, so this pass only reaches killers whose victim was already
  // booked — the deep-run killers. An unbooked same-stable finisher of the
  // victim hunts them down (deterministic: first eligible in bracket order).
  for (const bout of tour.bracket) {
    if (bout.isBronzeMatch || !bout.winner) continue;
    const loserId = (bout.winner === 'A' ? bout.warriorIdD : bout.warriorIdA) as WarriorId;
    const killerId = (bout.winner === 'A' ? bout.warriorIdA : bout.warriorIdD) as WarriorId;
    const loserStable = bout.winner === 'A' ? bout.stableIdD : bout.stableIdA;
    if (!loserId || !killerId || playerIds.has(loserId) || booked.has(killerId)) continue;
    const mate = (tour.participants ?? []).find(
      (p) => p.stableId === loserStable && p.id !== loserId && !booked.has(p.id)
    );
    if (!mate) continue;
    booked.add(mate.id);
    booked.add(killerId);
    offers.push(makeGrudgeOffer(state, tour, bout, mate.id, killerId));
  }
  return offers;
}

/**
 * Player call-out — files the loser→killer rematch the auto-pass held back
 * for manual decision. Validates the bracket loss and the ≤1-grudge dedup
 * against offers already pending for this tournament.
 */
export function fileGrudgeCallout(
  state: Pick<GameState, 'tournaments' | 'boutOffers' | 'week' | 'year' | 'absoluteWeek'>,
  tournamentId: TournamentId,
  loserId: WarriorId,
  killerId: WarriorId
): BoutOffer | null {
  const tour = (state.tournaments ?? []).find((t) => t.id === tournamentId);
  if (!tour || !tour.completed) return null;
  const bout = tour.bracket.find(
    (b) =>
      !b.isBronzeMatch &&
      b.winner &&
      ((b.winner === 'A' && b.warriorIdD === loserId && b.warriorIdA === killerId) ||
        (b.winner === 'D' && b.warriorIdA === loserId && b.warriorIdD === killerId))
  );
  if (!bout) return null;
  const booked = new Set(
    Object.values(state.boutOffers ?? {})
      .filter((o) => o.grudgeOfTournamentId === tournamentId && o.status === 'Proposed')
      .flatMap((o) => o.warriorIds)
  );
  if (booked.has(loserId) || booked.has(killerId)) return null;
  return makeGrudgeOffer(state, tour, bout, loserId, killerId);
}

/**
 * Player stablemate hunt — the manual counterpart of the AI's second pass.
 * An unbooked bracket finisher hunts a killer who felled one of its
 * stablemates (stable membership is frozen in the bracket's stableIdA/D).
 * The victim avenging itself is the call-out lane's job, not a hunt.
 */
export function fileStablemateHunt(
  state: Pick<GameState, 'tournaments' | 'boutOffers' | 'week' | 'year' | 'absoluteWeek'>,
  tournamentId: TournamentId,
  avengerId: WarriorId,
  killerId: WarriorId
): BoutOffer | null {
  const tour = (state.tournaments ?? []).find((t) => t.id === tournamentId);
  if (!tour || !tour.completed) return null;
  const avenger = (tour.participants ?? []).find((p) => p.id === avengerId);
  if (!avenger || avengerId === killerId) return null;
  const bout = tour.bracket.find((b) => {
    if (b.isBronzeMatch || !b.winner) return false;
    const loserId = b.winner === 'A' ? b.warriorIdD : b.warriorIdA;
    const winId = b.winner === 'A' ? b.warriorIdA : b.warriorIdD;
    const loserStable = b.winner === 'A' ? b.stableIdD : b.stableIdA;
    return winId === killerId && loserStable === avenger.stableId && loserId !== avengerId;
  });
  if (!bout) return null;
  const booked = new Set(
    Object.values(state.boutOffers ?? {})
      .filter((o) => o.grudgeOfTournamentId === tournamentId && o.status === 'Proposed')
      .flatMap((o) => o.warriorIds)
  );
  if (booked.has(avengerId) || booked.has(killerId)) return null;
  return makeGrudgeOffer(state, tour, bout, avengerId, killerId);
}

/** Shared offer construction — class purse quarter, week T+1, Proposed. */
function makeGrudgeOffer(
  state: Pick<GameState, 'week' | 'year' | 'absoluteWeek'>,
  tour: TournamentEntry,
  bout: TournamentBout,
  loserId: WarriorId,
  killerId: WarriorId
): BoutOffer {
  const purse = Math.floor(
    (TOURNAMENT_CLASSES.find((c) => c.id === tour.classId)?.purse ?? 400) / 4
  );
  return {
    id: `grudge_${tour.id}_${bout.round}_${bout.matchIndex}` as BoutOfferId,
    promoterId: GRUDGE_MATCHMAKING,
    warriorIds: [loserId, killerId],
    boutWeek: state.week + 1,
    expirationWeek: state.week + 1,
    purse,
    hype: 50,
    status: 'Proposed',
    responses: { [loserId]: 'Pending', [killerId]: 'Pending' },
    grudgeOfTournamentId: tour.id,
    createdAbsoluteWeek: state.absoluteWeek,
    createdAt: `Y${state.year}W${state.week}`,
  };
}
