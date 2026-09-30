import type { GameState } from '@/types/state.types';
import type { InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';
import { boutOfferExpirationAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { STABLE_DISSOLVED_REASON } from '@/engine/bout/mutations/contractMutations';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { isFightReady } from '@/engine/warrior/warriorStatus';
import { isTooInjuredToFight } from '@/engine/injuries';
import type { ChampionshipDelta } from '../core';
import { titleOf, ensureTitle, endReign, news, CHAMPIONSHIP_DEBUG } from '../core';
import { warriorDisplayName } from '@/utils/warriorDisplay';

// ─── 4. Refusal sweep ───────────────────────────────────────────────────────

/**
 * Reads resolved title-offer responses. Champion Declined with a blocking
 * injury is a postponement; otherwise refusals++ and strip at REFUSALS_TO_STRIP.
 * Challenger decline → CHALLENGER_COOLDOWN. A Signed title offer clears refusals.
 */
export function sweepTitleRefusals(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const offer of Object.values(state.boutOffers ?? {})) {
    const arenaId = offer?.titleArenaId;
    if (!arenaId) continue;
    const title = titleOf(state, delta, arenaId);
    if (!title) continue;

    if (offer.status === 'Signed') {
      CHAMPIONSHIP_DEBUG.signedSeen++;
      if (title.refusals !== 0) ensureTitle(state, delta, arenaId).refusals = 0;
      continue;
    }
    // Nothing ever writes 'Expired' — unsigned offers are silently pruned once
    // their expiration passes. Because this sweep runs before that prune, a
    // Proposed offer past its expiration IS an expiration: the bout window is
    // already gone (bout phase precedes the world stage), so any late response
    // cannot rescue it.
    const lapsedUnsigned =
      offer.status === 'Proposed' &&
      offer.expirationWeek != null &&
      boutOfferExpirationAbsoluteWeek(offer) <= now;
    if (offer.status !== 'Rejected' && offer.status !== 'Expired' && !lapsedUnsigned) continue;
    if (offer.status === 'Rejected') CHAMPIONSHIP_DEBUG.rejectedSeen++;
    else CHAMPIONSHIP_DEBUG.expiredSeen++;

    // A 'stable-dissolved' note marks an operational decline — the warrior's
    // stable left the world mid-negotiation, so the silence was never theirs.
    // Voided responses count for neither refusals nor contender cooldowns.
    const isVoidDecline = (id: WarriorId | undefined) =>
      id != null && offer.responseNotes?.[id] === STABLE_DISSOLVED_REASON;

    // Rejected → the explicit Declined party (skip voided parties — they are
    // bookkeeping, not blame). Expired/lapsed → whoever never accepted; the
    // champion is checked first (silence = ducking).
    const declinerId =
      offer.status === 'Rejected'
        ? offer.warriorIds.find(
            (id) => offer.responses?.[id] === 'Declined' && !isVoidDecline(id)
          )
        : title.champion &&
            offer.responses?.[title.champion.warriorId] !== 'Accepted' &&
            !isVoidDecline(title.champion.warriorId)
          ? title.champion.warriorId
          : offer.warriorIds.find(
              (id) => offer.responses?.[id] !== 'Accepted' && !isVoidDecline(id)
            );
    if (!declinerId) continue;
    const t = ensureTitle(state, delta, arenaId);

    if (declinerId === title.champion?.warriorId) {
      const champ = findWarriorById(state, declinerId);
      const blocking =
        champ &&
        !isFightReady(champ) &&
        (champ.injuries ?? []).some(
          (i): i is InjuryData => typeof i !== 'string' && isTooInjuredToFight([i])
        );
      if (blocking) {
        // Medical postponement — not a refusal.
        t.deferrals += 1;
        continue;
      }
      t.refusals += 1;
      if (t.refusals >= ARENA_TITLE.REFUSALS_TO_STRIP) {
        const champName = champ ? warriorDisplayName(champ) : declinerId;
        endReign(state, t, 'stripped', now);
        news(delta, state.week, `Champion Stripped`, [
          `${champName} is stripped of the crown for refusing to defend.`,
        ], `stripped-${arenaId}-${now}`);
      }
    } else {
      t.declinedContenders[declinerId] = now + ARENA_TITLE.CHALLENGER_COOLDOWN_WEEKS;
    }
  }
}
