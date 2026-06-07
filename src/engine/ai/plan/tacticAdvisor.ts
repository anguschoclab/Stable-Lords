/**
 * Tactic Advisory System
 * Selects best offensive and defensive tactics based on fighting style compatibility.
 */
import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from '@/types/shared.types';
import { getOffensiveSuitability, getDefensiveSuitability } from '@/engine/tacticSuitability';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
} from '@/engine/combat/mechanics/tacticResolution';

const suitabilityScore = (r: 'WS' | 'S' | 'U'): number => (r === 'WS' ? 2 : r === 'S' ? 1 : 0);

/**
 * Net offensive payoff of a tactic for a style, used to break suitability ties.
 * Rewards attack/damage/parry-bypass and decisiveness; discounts self-exposure
 * (defPenalty) and endurance cost so AIs don't default to the array-order pick.
 */
function offensiveTacticValue(style: FightingStyle, tactic: OffensiveTactic): number {
  if (tactic === 'none') return 0;
  const m = getOffensiveTacticMods(tactic, style);
  return (
    m.attBonus + m.dmgBonus + m.parryBypass * 0.5 + m.decBonus - m.defPenalty - m.endCost * 0.5
  );
}

/** Net defensive payoff of a tactic for a style, used to break suitability ties. */
function defensiveTacticValue(style: FightingStyle, tactic: DefensiveTactic): number {
  if (tactic === 'none') return 0;
  const m = getDefensiveTacticMods(tactic, style);
  return m.parBonus + m.defBonus + m.ripBonus + m.iniBonus;
}

/**
 * Pick the best offensive tactic for a style. Ranks by suitability first, then by
 * actual in-combat payoff so equally-suited styles (e.g. Striking Attack, which is
 * WS for everything) commit to their strongest option rather than the first listed.
 *
 * @param style - The fighting style to evaluate
 * @returns The best suited offensive tactic, or 'none' if nothing is suited
 */
export function getBestOffensiveTactic(style: FightingStyle): OffensiveTactic {
  const tactics: OffensiveTactic[] = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
  let best: OffensiveTactic = 'none';
  let bestScore = -1;
  let bestValue = -Infinity;
  for (const t of tactics) {
    const score = suitabilityScore(getOffensiveSuitability(style, t));
    if (score === 0) continue;
    const value = offensiveTacticValue(style, t);
    if (score > bestScore || (score === bestScore && value > bestValue)) {
      bestScore = score;
      bestValue = value;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}

/**
 * Pick the best defensive tactic for a style. Ranks by suitability first, then by
 * actual in-combat payoff to break ties between equally-suited tactics.
 *
 * @param style - The fighting style to evaluate
 * @returns The best suited defensive tactic, or 'none' if nothing is suited
 */
export function getBestDefensiveTactic(style: FightingStyle): DefensiveTactic {
  const tactics: DefensiveTactic[] = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
  let best: DefensiveTactic = 'none';
  let bestScore = -1;
  let bestValue = -Infinity;
  for (const t of tactics) {
    const score = suitabilityScore(getDefensiveSuitability(style, t));
    if (score === 0) continue;
    const value = defensiveTacticValue(style, t);
    if (score > bestScore || (score === bestScore && value > bestValue)) {
      bestScore = score;
      bestValue = value;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}
