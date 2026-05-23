/**
 * Tactic Advisory System
 * Selects best offensive and defensive tactics based on fighting style compatibility.
 */
import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from '@/types/shared.types';
import { getOffensiveSuitability, getDefensiveSuitability } from '@/engine/tacticSuitability';

/**
 * Pick the best-rated offensive tactic for a style, returning 'none' for TotalParry.
 *
 * @param style - The fighting style to evaluate
 * @returns The best suited offensive tactic
 */
export function getBestOffensiveTactic(style: FightingStyle): OffensiveTactic {
  const tactics: OffensiveTactic[] = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
  let best: OffensiveTactic = 'none';
  let bestScore = -1;
  for (const t of tactics) {
    const r = getOffensiveSuitability(style, t);
    const score = r === 'WS' ? 2 : r === 'S' ? 1 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}

/**
 * Pick the best-rated defensive tactic for a style.
 *
 * @param style - The fighting style to evaluate
 * @returns The best suited defensive tactic
 */
export function getBestDefensiveTactic(style: FightingStyle): DefensiveTactic {
  const tactics: DefensiveTactic[] = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
  let best: DefensiveTactic = 'none';
  let bestScore = -1;
  for (const t of tactics) {
    const r = getDefensiveSuitability(style, t);
    const score = r === 'WS' ? 2 : r === 'S' ? 1 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}
