import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { findWarriorById } from '@/engine/core/warriorLookup';
import type { ChampionshipDelta } from '../core';
import { ensureTitle, endReign, crown, news, cancelAllOpenOffersInvolving, CHAMPIONSHIP_DEBUG } from '../core';

// ─── 3. Result resolution ───────────────────────────────────────────────────

/** Applies this week's title-bout summaries to title records. */
export function resolveTitleBoutResults(state: GameState, delta: ChampionshipDelta): void {
  const now = state.absoluteWeek;
  for (const summary of state.arenaHistory ?? []) {
    const arenaId = summary.titleArenaId;
    if (!arenaId) continue;
    if (summary.absoluteWeek != null && summary.absoluteWeek !== now) continue;

    const title = ensureTitle(state, delta, arenaId);
    CHAMPIONSHIP_DEBUG.resultsResolved++;
    const champId = title.champion?.warriorId ?? null;

    if (summary.winner == null) {
      // Draw — champion retains; still counts as reign activity.
      if (title.champion) title.champion.lastActivityWeek = now;
      continue;
    }
    const winnerId = (summary.winner === 'A' ? summary.warriorIdA : summary.warriorIdD) as WarriorId;
    const loserId = (summary.winner === 'A' ? summary.warriorIdD : summary.warriorIdA) as WarriorId;

    if (champId == null) {
      // Vacant title bout — decisive winner takes the crown.
      crown(title, winnerId, now);
      news(delta, state.week, `New Champion Crowned`, [
        `${findWarriorById(state, winnerId)?.name ?? winnerId} claims the vacant crown.`,
      ], `crown-${arenaId}-${now}`);
      continue;
    }

    if (winnerId === champId) {
      const reign = title.champion;
      if (reign) {
        reign.defenses += 1;
        reign.lastActivityWeek = now;
      }
      title.refusals = 0;
      continue;
    }

    // Challenger won — did the champion die? A 'Kill' outcome means the loser
    // was killed; deathEventData.killerId confirms who dealt it.
    const champDied =
      loserId === champId &&
      (summary.by === 'Kill' ||
        (summary.isDeathEvent === true && summary.deathEventData?.killerId === winnerId));
    endReign(state, title, champDied ? 'died' : 'defeated', now);
    // Defensive single-crown enforcement: if the new champion somehow holds
    // another crown, that reign ends as relinquished.
    for (const [otherArena, other] of Object.entries(delta.arenaChampions)) {
      if (otherArena === arenaId) continue;
      if (other.champion?.warriorId === winnerId) {
        endReign(state, other, 'relinquished', now);
      }
    }
    for (const [otherArena, other] of Object.entries(state.arenaChampions ?? {})) {
      if (otherArena === arenaId || delta.arenaChampions[otherArena]) continue;
      if (other.champion?.warriorId === winnerId) {
        const t = ensureTitle(state, delta, otherArena);
        endReign(state, t, 'relinquished', now);
      }
    }
    crown(title, winnerId, now);
    // Coronation cancels the new champion's unresolved ordinary offers.
    cancelAllOpenOffersInvolving(state, delta, winnerId);
    news(delta, state.week, `Title Changes Hands`, [
      `${findWarriorById(state, winnerId)?.name ?? winnerId} takes the crown.`,
    ], `upset-${arenaId}-${now}`);
  }
}
