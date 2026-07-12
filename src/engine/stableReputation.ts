/**
 * Stable Reputation System — computes Fame, Notoriety, Honor, Adaptability.
 * Per Design Bible v3.0 §9.2
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
/**
 * Defines the shape of stable reputation.
 */

/**
 * Defines the shape of stable reputation.
 */
export type StableReputationInput = Pick<
  GameState,
  | 'roster'
  | 'graveyard'
  | 'arenaHistory'
  | 'newsletter'
  | 'player'
  | 'fame'
  | 'trainingAssignments'
  | 'trainers'
>;

/**
 *
 */
export interface StableReputation {
  fame: number; // 0-100: public acclaim
  notoriety: number; // 0-100: feared reputation
  honor: number; // 0-100: moral standing
  adaptability: number; // 0-100: strategic responsiveness
}

/**
 * Select the top N warriors by fame, sorted descending.
 */
export function getTopFameWarriors(warriors: Warrior[], count = 5): Warrior[] {
  const top: Warrior[] = [];
  for (let i = 0; i < warriors.length; i++) {
    const w = warriors[i];
    if (w) {
      if (top.length < count) {
        top.push(w);
        top.sort((a, b) => b.fame - a.fame);
      } else if (w.fame > (top[count - 1]?.fame ?? 0)) {
        top[count - 1] = w;
        top.sort((a, b) => b.fame - a.fame);
      }
    }
  }
  return top;
}

/**
 * Compute the fame score from top warriors, gazette mentions, and base state fame.
 */
export function computeFameScore(
  topWarriors: Warrior[],
  gazetteMentions: number,
  stateFame: number
): number {
  let sum = 0;
  for (let i = 0; i < topWarriors.length; i++) {
    const w = topWarriors[i];
    if (w) sum += w.fame;
  }
  const avgFame = topWarriors.length > 0 ? sum / topWarriors.length : 0;
  return Math.min(100, Math.round(avgFame * 2.0 + gazetteMentions * 1.0 + stateFame * 0.85));
}

/**
 * Calculate stable Fame based on top active warriors' fame and gazette mentions.
 */
function calculateFame(
  state: StableReputationInput,
  activeWarriors: Warrior[],
  gazetteMentions: number
): number {
  const topFame = getTopFameWarriors(activeWarriors);
  return computeFameScore(topFame, gazetteMentions, state.fame ?? 0);
}

/**
 * Calculate stable Notoriety based on kills and lethal bouts.
 */
function calculateNotoriety(totalKills: number, graveyardKills: number, killBouts: number): number {
  const notorietyRaw = totalKills * 4 + graveyardKills * 2 + killBouts * 5;
  return Math.min(100, Math.round(notorietyRaw * 2));
}

/**
 * Calculate stable Honor based on clean vs lethal bouts.
 */
function calculateHonor(cleanBouts: number, totalKills: number): number {
  const honorRaw = 50 + cleanBouts * 0.5 - totalKills * 5;
  return Math.min(100, Math.max(0, Math.round(honorRaw)));
}

/**
 * Calculate stable Adaptability based on style diversity and training setups.
 */
function calculateAdaptability(state: StableReputationInput, uniqueStyles: Set<string>): number {
  const trainingCount = (state.trainingAssignments ?? []).length;
  const adaptRaw = uniqueStyles.size * 8 + trainingCount * 3 + (state.trainers?.length ?? 0) * 2;
  return Math.min(100, Math.round(adaptRaw));
}

/**
 * Compute stable reputation from current game state.
 * Fame = average top-5 warrior fame + gazette mentions
 * Notoriety = kills * 2 + fatal finishers * 3 + rival kills * 5
 * Honor = base 50 + yields - dishonorable acts
 * Adaptability = style diversity + meta drift participation
 */
export function computeStableReputation(state: StableReputationInput): StableReputation {
  let totalKills = 0;
  let graveyardKills = 0;
  const uniqueStyles = new Set<string>();
  const activeWarriors: Warrior[] = [];

  // ⚡ Bolt: Single pass over roster to collect active warriors, total kills, and unique styles
  for (const w of state.roster) {
    if (w.status !== 'Active') continue;
    activeWarriors.push(w);
    uniqueStyles.add(w.style);
    totalKills += w.career?.kills || 0;
  }

  // ⚡ Bolt: Single pass over graveyard to collect kills
  for (let i = 0; i < state.graveyard.length; i++) {
    const g = state.graveyard[i];
    if (g) {
      graveyardKills += g.career?.kills || 0;
    }
  }

  let killBouts = 0;
  let cleanBouts = 0;

  // ⚡ Bolt: Single pass over arena history to collect bout stats
  for (let i = 0; i < state.arenaHistory.length; i++) {
    const f = state.arenaHistory[i];
    if (f) {
      if (f.by === 'Kill') {
        killBouts++;
      } else if (f.winner !== null) {
        cleanBouts++;
      }
    }
  }

  let gazetteMentions = 0;
  const stableName = state.player.stableName;

  // ⚡ Bolt: Single pass over newsletter for mentions
  if (state.newsletter) {
    for (let i = 0; i < state.newsletter.length; i++) {
      const items = state.newsletter[i]?.items;
      if (items) {
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          if (item && item.includes(stableName)) {
            gazetteMentions++;
            break; // Count once per newsletter
          }
        }
      }
    }
  }

  const fame = calculateFame(state, activeWarriors, gazetteMentions);
  const notoriety = calculateNotoriety(totalKills, graveyardKills, killBouts);
  const honor = calculateHonor(cleanBouts, totalKills);
  const adaptability = calculateAdaptability(state, uniqueStyles);

  return { fame, notoriety, honor, adaptability };
}

/**
 * Compute a rival stable's reputation from its data.
 */
export function computeRivalReputation(roster: Warrior[]): StableReputation {
  let totalKills = 0;
  let cleanBouts = 0;
  const uniqueStyles = new Set<string>();
  const activeWarriors: Warrior[] = [];

  // ⚡ Bolt: Single pass over roster to compute stats instead of multiple filters and reduce
  for (const w of roster) {
    if (w.status !== 'Active') continue;
    activeWarriors.push(w);
    uniqueStyles.add(w.style);
  }
  for (let i = 0; i < roster.length; i++) {
    const w = roster[i];
    if (w) {
      // Total kills and clean bouts uses full roster, not just active
      totalKills += w.career?.kills || 0;
      cleanBouts += (w.career?.wins || 0) + (w.career?.losses || 0) - (w.career?.kills || 0);
    }
  }

  const topFame = getTopFameWarriors(activeWarriors);
  let topFameSum = 0;
  for (let i = 0; i < topFame.length; i++) {
    const w = topFame[i];
    if (w) {
      topFameSum += w.fame;
    }
  }
  const avgFame = topFame.length > 0 ? topFameSum / topFame.length : 0;
  const fame = Math.min(100, Math.round(avgFame * 2.0));

  const notoriety = Math.min(100, Math.round(totalKills * 8));
  const honor = Math.min(100, Math.max(0, Math.round(50 + cleanBouts * 0.3 - totalKills * 5)));

  const adaptability = Math.min(100, Math.round(uniqueStyles.size * 10));

  return { fame, notoriety, honor, adaptability };
}
