import type { Warrior, RivalStableData, GameState } from '@/types/state.types';
import { computePlayerThreatLevel, type PlayerThreatLevel } from '@/engine/ai/agentCore';

/**
 * Observed-danger flag (opponent stable witnessed brawling high-OE) and the
 * player-threat level for player-bound offers.
 */
export function buildThreatContext(
  rival: RivalStableData,
  opponent: Warrior | undefined,
  state: GameState | undefined
): { observedDanger: boolean; playerThreat: PlayerThreatLevel } {
  // Observed danger: witnessed-tells dossiers that saw the opponent's stable
  // brawl high-OE tighten the style-matchup tolerance for calculating owners.
  const oppStableInfo = opponent ? state?.warriorToStableMap?.get(opponent.id) : undefined;
  const oppTells = oppStableInfo?.stableId
    ? rival.agentMemory?.opponentDossiers?.[oppStableInfo.stableId]?.observedTells
    : undefined;
  const observedDanger = !!oppTells && oppTells.samples >= 2 && oppTells.oe >= 0.7;

  // Player-bound offers: when the player's stable dominates the realm
  // rankings, rival owners adjust — calculating camps refuse to feed the
  // dominant stable, Showmen chase the upset, and everyone negotiates harder
  // because the dominant stable can afford it.
  const playerBound =
    !!opponent &&
    !!state &&
    (oppStableInfo?.isPlayer ?? (state.roster ?? []).some((w) => w.id === opponent.id));
  const playerThreat: PlayerThreatLevel =
    playerBound && state ? computePlayerThreatLevel(state) : 'Neutral';

  return { observedDanger, playerThreat };
}
