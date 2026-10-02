import type { GameState, BoutOffer } from '@/types/state.types';
import type { WarriorId, BoutOfferId, PromoterId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { ARENA_TITLE, ARENA_COMMISSION_ID } from '@/constants/arena';
import { getAllArenas } from '@/data/arenas';
import { displayWeek, isTournamentWeekOfYear } from '@/engine/core/absoluteWeek';
import { collectBookedWarriorIds } from '@/engine/core/warriorCollection';
import type { ChampionshipDelta } from '../core';
import {
  titleOf,
  ensureTitle,
  effectiveOffers,
  isOpenOffer,
  sortedTitleKeys,
  CHAMPIONSHIP_DEBUG,
} from '../core';
import { rankContenders, selectTitleContender } from '../queries';

// ─── 6. Scheduling ──────────────────────────────────────────────────────────

/**
 * Weekly title-bout cap: scales with the arena roster so every venue can
 * defend on cadence — at 47 arenas and a 4-week interval, ~12 defenses/week.
 * Floor is MIN_TITLE_BOUTS_PER_WEEK so a tiny roster still schedules bouts.
 */
export function titleBoutsPerWeekCap(arenaCount = getAllArenas().length): number {
  return Math.max(
    ARENA_TITLE.MIN_TITLE_BOUTS_PER_WEEK,
    Math.ceil(arenaCount / ARENA_TITLE.DEFENSE_INTERVAL_WEEKS)
  );
}

/**
 * Books title defenses for the next week on the normal cadence.
 * Skips non-active titles (transitions ran first), tournament weeks,
 * arenas with a live title offer, and reigns inside DEFENSE_INTERVAL_WEEKS.
 */
export function scheduleTitleBouts(
  state: GameState,
  delta: ChampionshipDelta,
  rng: IRNGService
): void {
  // Tournament weeks lock ordinary matchmaking — no defenses booked.
  if (isTournamentWeekOfYear(state.week)) return;

  const now = state.absoluteWeek;
  // Title offers use the same two-week horizon as ordinary producers: the bout
  // is targeted at now+2 so the week between (now+1) is the response window —
  // offers created for the immediately-next week can never be responded to in
  // time, since bout resolution runs before the world stage that processes
  // responses.
  const targetWeek = displayWeek(now + 2);
  const bookedNext = collectBookedWarriorIds(state, now + 2);
  const offers = effectiveOffers(state, delta);
  const liveTitleArenas = new Set(
    offers.flatMap((o) => (o.titleArenaId && isOpenOffer(o) ? [o.titleArenaId] : []))
  );

  const boutCap = titleBoutsPerWeekCap();
  let bookedCount = 0;
  for (const arenaId of sortedTitleKeys(state, delta)) {
    if (bookedCount >= boutCap) break;
    const title = titleOf(state, delta, arenaId);
    if (title?.status !== 'active') continue;
    if (liveTitleArenas.has(arenaId)) continue;

    if (title.champion) {
      const reign = title.champion;
      if (now - reign.lastActivityWeek < ARENA_TITLE.DEFENSE_INTERVAL_WEEKS) continue;
      if (bookedNext.has(reign.warriorId)) {
        ensureTitle(state, delta, arenaId).deferrals += 1;
        continue;
      }
      const contender = selectTitleContender(state, arenaId, delta, { bookedIds: bookedNext });
      if (!contender) {
        // Eligible-but-booked slides are informational; true no-contender
        // weeks are counted by the transition step.
        if (selectTitleContender(state, arenaId, delta)) {
          ensureTitle(state, delta, arenaId).deferrals += 1;
        }
        continue;
      }
      delta.newOffers.push(
        makeTitleOffer(rng, arenaId, reign.warriorId, contender.id, targetWeek, now)
      );
      CHAMPIONSHIP_DEBUG.offersCreated++;
      CHAMPIONSHIP_DEBUG.defensesScheduled++;
      liveTitleArenas.add(arenaId);
      bookedNext.add(contender.id);
      bookedNext.add(reign.warriorId);
      bookedCount++;
    } else {
      // Vacant — top two eligible contenders fight for the crown.
      const ranked = rankContenders(state, arenaId, delta, { bookedIds: bookedNext });
      if (ranked.length < 2) {
        if (ranked.length >= 1) ensureTitle(state, delta, arenaId).deferrals += 1;
        continue;
      }
      const [a, b] = ranked;
      if (!a || !b) continue;
      delta.newOffers.push(
        makeTitleOffer(rng, arenaId, a.warrior.id, b.warrior.id, targetWeek, now)
      );
      CHAMPIONSHIP_DEBUG.offersCreated++;
      liveTitleArenas.add(arenaId);
      bookedNext.add(a.warrior.id);
      bookedNext.add(b.warrior.id);
      bookedCount++;
    }
  }
}

function makeTitleOffer(
  rng: IRNGService,
  arenaId: string,
  aId: WarriorId,
  bId: WarriorId,
  targetDisplayWeek: number,
  now: number
): BoutOffer {
  const purse = Math.round(200 * ARENA_TITLE.PURSE_MULTIPLIER);
  return {
    id: rng.uuid('title-offer') as BoutOfferId,
    promoterId: ARENA_COMMISSION_ID as PromoterId,
    warriorIds: [aId, bId],
    boutWeek: targetDisplayWeek,
    // Expiry is the bout week itself, not the week before: offer impacts only
    // land in state at world-stage resolution, so rival responses always come
    // one tick later — during advance(now+1→now+2)'s world stage, whose prune
    // drops unsigned offers with expiration <= absoluteWeek(now+1). Expiring at
    // the bout week gives the offer exactly one full response window and is
    // still caught by the refusal sweep (which runs before the prune) if
    // nobody answers.
    expirationWeek: displayWeek(now + 2),
    purse,
    hype: 50 + ARENA_TITLE.HYPE_BONUS,
    status: 'Proposed',
    responses: { [aId]: 'Pending', [bId]: 'Pending' },
    proposerStableId: undefined,
    conditions: ['TITLE BOUT'],
    arenaId,
    createdAbsoluteWeek: now,
    titleArenaId: arenaId,
  };
}
