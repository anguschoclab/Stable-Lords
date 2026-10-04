import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { WarriorId } from '@/types/shared.types';
import { findWarriorById } from '@/engine/core/warriorLookup';
import type { ChampionshipDelta } from '../core';
import {
  ensureTitle,
  endReign,
  crown,
  news,
  cancelAllOpenOffersInvolving,
  awardEpithet,
  CHAMPIONSHIP_DEBUG,
} from '../core';

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
    const winnerId = (
      summary.winner === 'A' ? summary.warriorIdA : summary.warriorIdD
    ) as WarriorId;
    const loserId = (summary.winner === 'A' ? summary.warriorIdD : summary.warriorIdA) as WarriorId;

    if (champId == null) {
      // Vacant title bout — decisive winner takes the crown.
      crown(title, winnerId, now);
      awardEpithet(state, delta, winnerId, 'arena_champion');
      news(
        delta,
        state.week,
        `New Champion Crowned`,
        [`${findWarriorById(state, winnerId)?.name ?? winnerId} claims the vacant crown.`],
        `crown-${arenaId}-${now}`
      );
      continue;
    }

    if (winnerId === champId) {
      const reign = title.champion;
      if (reign) {
        reign.defenses += 1;
        reign.lastActivityWeek = now;
      }
      // A completed defense erodes one refusal — signing alone does not.
      title.refusals = Math.max(0, title.refusals - 1);
      continue;
    }

    transferCrown({ state: state, delta: delta, title: title, arenaId: arenaId, champId: champId, winnerId: winnerId, loserId: loserId, summary: summary, now: now });
  }
}

interface TransferCrownArgs {
  state: GameState;
  delta: ChampionshipDelta;
  title: ReturnType<typeof ensureTitle>;
  arenaId: string;
  champId: WarriorId | null;
  winnerId: WarriorId;
  loserId: WarriorId;
  summary: FightSummary;
  now: number;
}

/**
 * Challenger won — transfer the crown. The old reign ends as 'died' when the
 * champion was killed in the bout; the new champion's other crowns (if any)
 * are relinquished (single-crown enforcement), and coronation cancels their
 * unresolved ordinary offers.
 */
function transferCrown(args: TransferCrownArgs): void {
  const { state, delta, title, arenaId, champId } = args;
  const { winnerId, loserId, summary, now } = args;
  // Did the champion die? A 'Kill' outcome means the loser was killed;
  // deathEventData.killerId confirms who dealt it.
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
  awardEpithet(state, delta, winnerId, 'arena_champion');
  // Coronation cancels the new champion's unresolved ordinary offers.
  cancelAllOpenOffersInvolving(state, delta, winnerId);
  news(
    delta,
    state.week,
    `Title Changes Hands`,
    [`${findWarriorById(state, winnerId)?.name ?? winnerId} takes the crown.`],
    `upset-${arenaId}-${now}`
  );
}
