import type { GameState, RivalStableData } from '@/types/state.types';
import { ARENA_TITLE } from '@/constants/arena';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { keySet } from '@/utils/collections';
import type { ChampionshipDelta } from '../core';
import { titleOf, effectiveOffers, isOpenOffer, sortedTitleKeys } from '../core';

// ─── 7. Perks ───────────────────────────────────────────────────────────────

/**
 * Weekly champion trickle — only for active titles whose reign saw activity
 * inside ACTIVITY_WINDOW_WEEKS (or has a live title offer outstanding).
 */
export function applyChampionPerks(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  const offers = effectiveOffers(state, delta);
  const arenasWithLiveOffer = new Set(
    offers.flatMap((o) => (o.titleArenaId && isOpenOffer(o) ? [o.titleArenaId] : []))
  );
  const playerRosterIds = keySet(state.roster ?? [], (w) => w.id);
  // First-rival-wins: a warrior id owned by two stables resolves to the
  // first, matching the previous rivals.find scan.
  const stableByWarrior = new Map<string, RivalStableData>();
  for (const r of state.rivals ?? []) {
    for (const w of r.roster ?? []) {
      if (!stableByWarrior.has(w.id)) stableByWarrior.set(w.id, r);
    }
  }

  for (const arenaId of sortedTitleKeys(state, delta)) {
    const title = titleOf(state, delta, arenaId);
    if (!title?.champion || title.status !== 'active') continue;
    const recentActivity =
      now - title.champion.lastActivityWeek <= ARENA_TITLE.ACTIVITY_WINDOW_WEEKS ||
      arenasWithLiveOffer.has(arenaId);
    if (!recentActivity) continue;

    const id = title.champion.warriorId;
    if (playerRosterIds.has(id)) {
      const existing = delta.rosterUpdates.get(id) ?? {};
      delta.rosterUpdates.set(id, {
        ...existing,
        fame:
          (existing.fame ?? findWarriorById(state, id)?.fame ?? 0) +
          ARENA_TITLE.CHAMPION_FAME_PER_WEEK,
        popularity:
          (existing.popularity ?? findWarriorById(state, id)?.popularity ?? 0) +
          ARENA_TITLE.CHAMPION_POPULARITY_PER_WEEK,
      });
    } else {
      const rival = stableByWarrior.get(id);
      if (!rival) continue;
      const roster = rival.roster.map((x) =>
        x.id === id
          ? {
              ...x,
              fame: (x.fame ?? 0) + ARENA_TITLE.CHAMPION_FAME_PER_WEEK,
              popularity: (x.popularity ?? 0) + ARENA_TITLE.CHAMPION_POPULARITY_PER_WEEK,
            }
          : x
      );
      delta.rivalsUpdates.set(rival.id, { roster });
    }
  }
}
