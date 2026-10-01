import type { GameState } from '@/types/state.types';
import type { WarriorAdvisorCard, CouncilLookahead } from '../types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { ARENA_TITLE } from '@/constants/arena';
/** Signed/accepted future bout commitments beyond the upcoming week. */
export function listFutureCommitments(
  state: GameState,
  cards: WarriorAdvisorCard[],
  playerWarriorIds: Set<string>,
  upcomingAbsWeek: number
): CouncilLookahead['futureCommitments'] {
  return Object.values(state.boutOffers || {})
    .filter((o) => {
      const playerId = o.warriorIds.find((wid) => playerWarriorIds.has(wid));
      return (
        playerId !== undefined &&
        boutOfferAbsoluteWeek(o) > upcomingAbsWeek &&
        (o.status === 'Signed' || o.responses[playerId] === 'Accepted')
      );
    })
    .map((o) => {
      const playerId = o.warriorIds.find((wid) => playerWarriorIds.has(wid));
      if (playerId === undefined) return null;
      const opponentId = o.warriorIds.find((wid) => wid !== playerId);
      return {
        offerId: o.id,
        warriorId: playerId,
        warriorName: cards.find((c) => c.warriorId === playerId)?.warriorName ?? playerId,
        opponentName: opponentId
          ? (findWarriorById(state, opponentId)?.name ?? 'Unknown Opponent')
          : 'Unknown Opponent',
        absoluteWeek: boutOfferAbsoluteWeek(o),
        purse: o.purse,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.absoluteWeek - b.absoluteWeek);
}

/** Weeks-until-return projections for injured warriors. */
export function listRecoveryEtas(
  activeWarriors: GameState['roster'],
  currentAbsWeek: number
): CouncilLookahead['recoveryEtas'] {
  return activeWarriors
    .map((w) => {
      const weeks = Math.max(0, ...(w.injuries || []).map((i) => i.weeksRemaining ?? 0));
      return weeks > 0
        ? {
            warriorId: w.id,
            warriorName: w.name,
            weeksRemaining: weeks,
            returnsAbsoluteWeek: currentAbsWeek + weeks,
          }
        : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

/**
 * Title-defense obligations: crowns the player holds become due when the
 * reign's activity gap reaches DEFENSE_INTERVAL_WEEKS — surfaced so the
 * council can plan around a forced title bout.
 */
export function listTitleDefenses(
  state: GameState,
  cards: WarriorAdvisorCard[],
  playerWarriorIds: Set<string>
): CouncilLookahead['titleDefenses'] {
  return Object.entries(state.arenaChampions ?? {})
    .flatMap(([arenaId, t]) => {
      const champ = t.champion;
      if (!champ || !playerWarriorIds.has(champ.warriorId)) return [];
      return [
        {
          arenaId,
          warriorId: champ.warriorId,
          warriorName:
            cards.find((c) => c.warriorId === champ.warriorId)?.warriorName ?? champ.warriorId,
          dueAbsoluteWeek: champ.lastActivityWeek + ARENA_TITLE.DEFENSE_INTERVAL_WEEKS,
        },
      ];
    })
    .sort((a, b) => a.dueAbsoluteWeek - b.dueAbsoluteWeek);
}
