import type { GameState } from '@/types/state.types';
import { ARENA_TITLE } from '@/constants/arena';
import type { ChampionshipDelta } from '../core';
import {
  titleOf,
  ensureTitle,
  effectiveOffers,
  news,
  cancelUnsignedOffersInvolving,
  sortedTitleKeys,
} from '../core';
import { selectTitleContender } from '../queries';

// ─── 5. Lifecycle transitions ───────────────────────────────────────────────

/**
 * Evaluates every titled arena each week — dormant titles included.
 *
 *  active            + no contender ≥ DORMANCY_STREAK  → dormant
 *  dormant           + contender emerges               → pendingReengagement
 *                    (+ cancel the champion's unsigned ordinary offers)
 *  pendingReengagement + signed ordinary offers remain → stay pending (deferrals++)
 *  pendingReengagement + drained                       → active (defense books same pass)
 *  pending/dormant   + contender gone                  → dormant
 */
export function applyLifecycleTransitions(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const arenaId of sortedTitleKeys(state, delta)) {
    const base = titleOf(state, delta, arenaId);
    if (!base?.champion) continue; // vacant titles have no dormancy lifecycle
    const champId = base.champion.warriorId;

    // Contender existence ignores booking — a booked contender still counts.
    const contender = selectTitleContender(state, arenaId, delta, { includeUnready: false });

    switch (base.status) {
      case 'active': {
        if (contender) {
          if (base.noContenderStreak !== 0) {
            ensureTitle(state, delta, arenaId).noContenderStreak = 0;
          }
        } else {
          const t = ensureTitle(state, delta, arenaId);
          t.noContenderStreak += 1;
          if (t.noContenderStreak >= ARENA_TITLE.DORMANCY_STREAK) {
            t.status = 'dormant';
            news(
              delta,
              state.week,
              `Title Goes Dormant`,
              [`No eligible contender remains — the champion may take ordinary bouts.`],
              `dormant-${arenaId}-${now}`
            );
          }
        }
        break;
      }
      case 'dormant': {
        const t = ensureTitle(state, delta, arenaId);
        if (contender) {
          t.status = 'pendingReengagement';
          t.noContenderStreak = 0;
          // Cancel unsigned ordinary offers now so the drain bound is real.
          cancelUnsignedOffersInvolving(state, delta, champId);
          news(
            delta,
            state.week,
            `Title Re-engages`,
            [`A challenger has emerged — the champion must return to title bouts.`],
            `pending-${arenaId}-${now}`
          );
        } else {
          t.noContenderStreak += 1;
        }
        break;
      }
      case 'pendingReengagement': {
        const t = ensureTitle(state, delta, arenaId);
        if (!contender) {
          t.status = 'dormant';
          t.noContenderStreak = 1;
          break;
        }
        const hasSignedOrdinary = effectiveOffers(state, delta).some(
          (o) => !o.titleArenaId && o.status === 'Signed' && o.warriorIds.includes(champId)
        );
        if (hasSignedOrdinary) {
          t.deferrals += 1;
        } else {
          t.status = 'active';
        }
        break;
      }
    }
  }
}
