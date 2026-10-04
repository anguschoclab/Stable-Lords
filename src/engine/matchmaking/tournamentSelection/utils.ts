import type { GameState, Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { aiPlanForWarrior } from '@/engine';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { getPairKey } from '@/utils/keyUtils';
import { generateWarriorName } from '@/data/names/nameGenerator';

/**
 * Get ai plan.
 * @param opponentStyle - Opponent style. (optional)
 * @param opponentOwnerId - Opponent owner id. (optional)
 */

/**
 * Get ai plan.
 * @param state -
 * @param w -
 * @param opponentStyle -
 * @param opponentOwnerId -
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
    { w: w, personality: rival.owner.personality || 'Pragmatic', philosophy: rival.philosophy || 'Opportunist', opponentStyle: opponentStyle, intent: rival.strategy?.intent, grudgeIntensity: grudgeIntensity }
  );
}

/**
 * Generate a tournament emergency-fill freelancer. Named via the unified
 * generator with the 'lowborn' culture (unattached pit-fighters) —
 * `usedNames` should cover the world plus already-filled bracket slots;
 * the caller owns the set and adds each returned name.
 */
export function generateFreelancer(
  tier: string,
  _index: number,
  rng: SeededRNG,
  usedNames?: ReadonlySet<string>
): Warrior {
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
  const name = generateWarriorName({ rng, culture: 'lowborn', usedNames });
  return makeWarrior({ id: undefined, name: name, style: style, attrs: attrs, overrides: {}, rng: rng });
}
