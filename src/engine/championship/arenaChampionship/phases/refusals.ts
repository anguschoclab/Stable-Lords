import type { GameState } from '@/types/state.types';
import type { InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';
import { boutOfferExpirationAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { isVoidDeclineReason } from '@/engine/bout/mutations/contractMutations';
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
 * Challenger decline → CHALLENGER_COOLDOWN. A Signed title offer no longer
 * clears refusals — only a won defense decays them by one.
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
      // Signing a defense is a commitment, not a completed defense — refusals
      // persist until the bout is fought and won (see resolveTitleBoutResults,
      // which decays refusals on a champion win). Otherwise a duck could
      // alternate refuse→sign forever and never reach the strip threshold.
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

    // A registered void note marks an operational decline — the warrior's
    // stable left the world mid-negotiation, so the silence was never theirs.
    // Voided responses count for neither refusals nor contender cooldowns.
    const isVoidDecline = (id: WarriorId | undefined) =>
      id != null && isVoidDeclineReason(offer.responseNotes?.[id]);

    // Rejected → the explicit Declined party (skip voided parties — they are
    // bookkeeping, not blame). Expired/lapsed → whoever never accepted; the
    // champion is checked first (silence = ducking).
    const declinerId =
      offer.status === 'Rejected'
        ? offer.warriorIds.find((id) => offer.responses?.[id] === 'Declined' && !isVoidDecline(id))
        : title.champion &&
            offer.responses?.[title.champion.warriorId] !== 'Accepted' &&
            !isVoidDecline(title.champion.warriorId)
          ? title.champion.warriorId
          : offer.warriorIds.find(
              (id) => offer.responses?.[id] !== 'Accepted' && !isVoidDecline(id)
            );
    if (!declinerId) continue;
    applyDecline(state, delta, arenaId, title.champion?.warriorId, declinerId, now);
  }
}

/**
 * Apply a declined title offer: champion refusal → refusals++ or a medical
 * deferral for blocking injuries, with a strip at REFUSALS_TO_STRIP;
 * challenger decline → CHALLENGER_COOLDOWN.
 */
function applyDecline(
  state: GameState,
  delta: ChampionshipDelta,
  arenaId: string,
  championId: WarriorId | undefined,
  declinerId: WarriorId,
  now: number
): void {
  const t = ensureTitle(state, delta, arenaId);
  if (declinerId !== championId) {
    t.declinedContenders[declinerId] = now + ARENA_TITLE.CHALLENGER_COOLDOWN_WEEKS;
    return;
  }
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
    return;
  }
  t.refusals += 1;
  if (t.refusals >= ARENA_TITLE.REFUSALS_TO_STRIP) {
    const champName = champ ? warriorDisplayName(champ) : declinerId;
    endReign(state, t, 'stripped', now);
    news(
      delta,
      state.week,
      `Champion Stripped`,
      [`${champName} is stripped of the crown for refusing to defend.`],
      `stripped-${arenaId}-${now}`
    );
  }
}
