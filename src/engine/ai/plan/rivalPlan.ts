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
import { aiPlanForWarrior } from './coreGenerator';
import { getPairKey } from '@/utils/keyUtils';

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
 * Build the fight plan a rival stable's warrior commits against an opponent:
 * the shared grudge-lookup + `aiPlanForWarrior` tail. The no-rival fallback
 * (`defaultPlanForWarrior` + `killDesire: 7`) stays at the call sites.
 */
export function rivalFightPlan(
  state: GameState,
  w: Warrior,
  rival: RivalStableData,
  opts: RivalFightPlanOpts = {}
): FightPlan {
  const { opponentStyle, opponentId, opponentStableId, dossier, now } = opts;

  let grudgeIntensity = 0;
  if (opponentId) {
    const grudge = state.grudgeMap?.get(getPairKey(rival.owner.id, opponentId));
    grudgeIntensity = grudge?.intensity ?? 0;
  }

  return aiPlanForWarrior({
    w: w,
    personality: rival.owner.personality || 'Pragmatic',
    philosophy: rival.philosophy || 'Opportunist',
    opponentStyle: opponentStyle,
    intent: rival.strategy?.intent,
    grudgeIntensity: grudgeIntensity,
    dossier:
      dossier ??
      (opponentStableId ? rival.agentMemory?.opponentDossiers?.[opponentStableId] : undefined),
    now: now ?? state.absoluteWeek ?? state.week,
    competence: rival.owner.competence,
  });
}
