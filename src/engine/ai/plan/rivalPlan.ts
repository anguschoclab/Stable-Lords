/**
 * Shared rival-warrior fight-plan builder — collapses the grudge-lookup +
 * `aiPlanForWarrior` tail duplicated across `getNPCPlan` (bout resolution),
 * `getAIPlan` (tournament selection), and `agentPlanForWarrior` (plan
 * persistence).
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { OpponentDossier } from '@/types/state/game';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';

/** Options for {@link rivalFightPlan}. */
export interface RivalFightPlanOpts {
  /** Opponent fighting style, when known. */
  opponentStyle?: FightingStyle;
  /**
   * Grudge-map lookup key — the OWNER-id namespace (the player's
   * `state.player.id` doubles as the player-side key).
   */
  opponentId?: string;
  /** Opponent's stable id — used for `agentMemory.opponentDossiers` lookup. */
  opponentStableId?: string;
  /** Explicit dossier — takes precedence over the stableId lookup. */
  dossier?: OpponentDossier;
  /** Current absolute week for intel freshness (defaults to state). */
  now?: number;
}

/**
 * Build the fight plan a rival stable's warrior commits against an opponent.
 * NOT IMPLEMENTED — signature stub for the test-first commit; replaced in the
 * rival-plan dedup commit.
 */
export function rivalFightPlan(
  _state: GameState,
  _w: Warrior,
  _rival: RivalStableData,
  _opts: RivalFightPlanOpts = {}
): FightPlan {
  throw new Error('rivalFightPlan: not implemented');
}
