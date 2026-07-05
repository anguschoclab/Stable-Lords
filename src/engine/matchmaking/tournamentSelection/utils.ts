import type { GameState, Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { aiPlanForWarrior, defaultPlanForWarrior } from '@/engine';
import { findWarriorById, clearWarriorCache } from '@/engine/core/warriorLookup';
import { getPairKey } from '@/utils/keyUtils';

// Re-export for backward compatibility
export { findWarriorById, clearWarriorCache }; /**
 * Get ai plan.
 * @param opponentStyle - Opponent style. (optional)
 * @param opponentOwnerId - Opponent owner id. (optional)
 */

/**
 * Get ai plan.
 * @param opponentStyle - Opponent style. (optional)
 * @param opponentOwnerId - Opponent owner id. (optional)
 */
export function getAIPlan(
  state: GameState,
  w: Warrior,
  opponentStyle?: FightingStyle,
  opponentOwnerId?: string
) {
  // warrior.stableId is rival.id (StableId), not owner.id
  const rival = w.stableId ? state.rivalMap?.get(w.stableId) : undefined;
  if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };

  let grudgeIntensity = 0;
  if (opponentOwnerId) {
    const grudge = state.grudgeMap?.get(getPairKey(rival.owner.id, opponentOwnerId));
    grudgeIntensity = grudge?.intensity ?? 0;
  }

  return aiPlanForWarrior(
    w,
    rival.owner.personality || 'Pragmatic',
    rival.philosophy || 'Opportunist',
    opponentStyle,
    rival.strategy?.intent,
    grudgeIntensity
  );
} /**
 * Generate freelancer.
 */

/**
 * Generate freelancer.
 */
export function generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
  const styles = Object.values(FightingStyle);
  const style = rng.pick(styles);
  const pool = tier === 'Gold' ? 120 : tier === 'Silver' ? 100 : tier === 'Bronze' ? 85 : 70;
  const attrs = { ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5 };
  let remaining = pool - 50;
  const keys: (keyof typeof attrs)[] = ['ST', 'CN', 'SP', 'DF', 'WL', 'WT'];
  while (remaining > 0) {
    const key = rng.pick(keys);
    if (attrs[key] < 25) {
      attrs[key]++;
      remaining--;
    }
  }
  return makeWarrior(
    undefined,
    `Freelancer ${rng.pick(['Thrax', 'Murmillo', 'Kaeso'])} #${index}`,
    style,
    attrs,
    {},
    rng
  );
}
