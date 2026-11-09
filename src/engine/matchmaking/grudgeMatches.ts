import type { BoutOffer, GameState } from '@/types/state.types';
import type { BoutOfferId, PromoterId, TournamentId, WarriorId } from '@/types/shared.types';
import { TOURNAMENT_CLASSES } from './tournamentSelection/classes';

/** Grudge-match promoter — the arena office booking exhibition rematches. */
const GRUDGE_MATCHMAKING = 'GRUDGE_MATCHMAKING' as PromoterId;

/**
 * Grudge matches — post-tournament exhibition bouts (V27, Phase 10).
 *
 * For every non-consolation bracket bout in a completed class tournament,
 * the loser calls out the warrior who eliminated them: a rematch filed as an
 * ordinary week-T+1 bout offer (+1 FE on resolution) that flows through the
 * standard offer/acceptance lane. Deduped to ≤1 grudge per warrior — the
 * first call-out (deepest-round-first isn't required; bracket order already
 * favors later rounds via matchIndex ordering) wins.
 */
export function buildGrudgeOffers(
  state: GameState,
  tournamentId: TournamentId
): BoutOffer[] {
  const tour = (state.tournaments ?? []).find((t) => t.id === tournamentId);
  if (!tour || !tour.completed) return [];

  const purse = Math.floor(
    (TOURNAMENT_CLASSES.find((c) => c.id === tour.classId)?.purse ?? 400) / 4
  );
  const booked = new Set<WarriorId>();
  const offers: BoutOffer[] = [];

  for (const bout of tour.bracket) {
    if (bout.isBronzeMatch || !bout.winner) continue;
    const loserId = (bout.winner === 'A' ? bout.warriorIdD : bout.warriorIdA) as WarriorId;
    const killerId = (bout.winner === 'A' ? bout.warriorIdA : bout.warriorIdD) as WarriorId;
    if (!loserId || !killerId || booked.has(loserId) || booked.has(killerId)) continue;
    booked.add(loserId);
    booked.add(killerId);
    offers.push({
      id: `grudge_${tournamentId}_${bout.round}_${bout.matchIndex}` as BoutOfferId,
      promoterId: GRUDGE_MATCHMAKING,
      warriorIds: [loserId, killerId],
      boutWeek: state.week + 1,
      expirationWeek: state.week + 1,
      purse,
      hype: 50,
      status: 'Proposed',
      responses: { [loserId]: 'Pending', [killerId]: 'Pending' },
      grudgeOfTournamentId: tournamentId,
      createdAbsoluteWeek: state.absoluteWeek,
      createdAt: `Y${state.year}W${state.week}`,
    });
  }
  return offers;
}
