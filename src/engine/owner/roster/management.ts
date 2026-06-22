import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { computeMetaDrift } from '../../metaDrift';
import { getRecentFightsForWarrior } from '@/engine/core/historyUtils';
import { META_RECRUIT_QUOTES } from '@/data/ownerData';
import { SeededRNGService } from '@/utils/random';
import { filterActive } from '@/utils/roster';
import { generateAIRecruit } from './recruitGenerator';
import { computeWarriorLiability } from '@/engine/warriorValue';
import { policyFor } from '@/engine/ai/traitPolicy';

/**
 * Manages the roster of AI owners by evaluating current warriors, recruiting talent,
 * and releasing underperforming assets based on current owner personality and budget.
 *
 * @param state - The current game state
 * @param rng - Optional RNG service
 * @returns Updated rivals list and gazette news items
 */
export function processAIRosterManagement(
  state: GameState,
  rng?: IRNGService
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rngSnapshot = rng || new SeededRNGService(state.week * 7919 + 101);
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory, 20);
  const gazetteItems: string[] = [];
  const updatedRivals = (state.rivals || []).map((rival) => {
    const r = {
      ...rival,
      roster: rival.roster.map((w) => ({ ...w, career: { ...w.career } })),
      owner: { ...rival.owner },
    };

    const personality = r.owner.personality ?? 'Pragmatic';
    const activeBeforeCulling = filterActive(r.roster).length;

    // 1) Retirement / Culling Logic
    let culledThisTick = 0;

    // Trajectory guard: warriors on a hot streak (3+ wins in last 5 fights) are
    // protected from any personality-based culling regardless of career win-rate.
    const isOnWinStreak = (w: Warrior) => {
      const total = w.career.wins + w.career.losses;
      if (total < 5) return false;
      const wId = w.id;
      const recentFights = getRecentFightsForWarrior(state.arenaHistory, wId, 5);
      const recentWins = recentFights.filter(
        (f) =>
          (f.warriorIdA === wId && f.winner === 'A') || (f.warriorIdD === wId && f.winner === 'D')
      ).length;
      return recentWins >= 3;
    };

    // Methodical/Tactician owners cull underperformers
    if (personality === 'Methodical' || personality === 'Tactician') {
      const candidates = filterActive(r.roster).filter(
        (w) =>
          w.career.wins + w.career.losses >= 5 &&
          w.career.wins / Math.max(1, w.career.wins + w.career.losses) < 0.3 &&
          (w.age ?? 18) >= 25 &&
          !isOnWinStreak(w)
      );
      for (const c of candidates.slice(0, 1)) {
        c.status = 'Retired';
        c.retiredWeek = state.week;
        culledThisTick++;
        gazetteItems.push(
          `📋 ${r.owner.name} (${r.owner.stableName}) retires ${c.name} — "Not meeting expectations."`
        );
      }
    }

    // Aggressive owners cull warriors with 0 kills after many fights
    if (personality === 'Aggressive') {
      const killless = filterActive(r.roster).filter(
        (w) =>
          w.career.kills === 0 &&
          w.career.wins + w.career.losses >= 8 &&
          (w.age ?? 18) >= 24 &&
          !isOnWinStreak(w)
      );
      for (const c of killless.slice(0, 1)) {
        c.status = 'Retired';
        c.retiredWeek = state.week;
        culledThisTick++;
        gazetteItems.push(
          `🗡️ ${r.owner.name} (${r.owner.stableName}) cuts ${c.name} — "No killer instinct."`
        );
      }
    }

    // Liability-based culling: release flaw-loaded warriors per personality threshold
    const traitPolicy = policyFor(r.owner.personality);
    const liabilityCandidates = filterActive(r.roster).filter((w) => {
      if (isOnWinStreak(w)) return false;
      const liability = computeWarriorLiability(w);
      return (
        liability.score >= traitPolicy.cutLiabilityThreshold ||
        liability.recommendation === 'Release'
      );
    });
    for (const c of liabilityCandidates.slice(0, 1)) {
      c.status = 'Retired';
      c.retiredWeek = state.week;
      culledThisTick++;
      gazetteItems.push(
        `📋 ${r.owner.name} (${r.owner.stableName}) releases ${c.name} — too many flaws.`
      );
    }

    // Age-based retirement
    const elderly = filterActive(r.roster).filter((w) => (w.age ?? 18) >= 30);
    for (const old of elderly.slice(0, 1)) {
      if (rngSnapshot.next() < 0.15) {
        old.status = 'Retired';
        old.retiredWeek = state.week;
        gazetteItems.push(
          `🏠 ${old.name} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`
        );
      }
    }

    // 2) Recruitment Logic
    const currentActive = filterActive(r.roster).length;
    const minRoster = personality === 'Aggressive' ? 8 : personality === 'Showman' ? 7 : 6;
    const recruitChance =
      currentActive < 4
        ? 1.0
        : personality === 'Aggressive'
          ? 0.4
          : personality === 'Pragmatic'
            ? 0.25
            : 0.15;

    // Treasury Awareness: Recruitment costs 100g (signing fee)
    const RECRUIT_COST = 100;
    const canAfford = r.treasury >= RECRUIT_COST + (activeBeforeCulling < 4 ? 0 : 200); // Only enforce buffer if roster was healthy before culling
    const intent = r.strategy?.intent ?? 'CONSOLIDATION';

    if (
      currentActive < minRoster &&
      culledThisTick === 0 &&
      rngSnapshot.next() < recruitChance &&
      canAfford &&
      intent !== 'RECOVERY'
    ) {
      const adaptation = r.owner.metaAdaptation ?? 'Opportunist';
      let customMeta = meta;

      // Special handling for rivalries: counter player's favorite style
      if (state.rivalries) {
        const rivalry = state.rivalries.find(
          (rv) =>
            (rv.stableIdA === state.player.id && rv.stableIdB === r.owner.id) ||
            (rv.stableIdB === state.player.id && rv.stableIdA === r.owner.id)
        );
        if (rivalry && rivalry.intensity >= 3 && adaptation !== 'Traditionalist') {
          const playerMeta = computeMetaDrift(
            getRecentFightsForWarrior(state.arenaHistory, state.player.id, 10),
            10
          );
          if (Object.keys(playerMeta).length > 0) customMeta = playerMeta;
        }
      }

      const newWarrior = generateAIRecruit(r, state.week, customMeta);
      if (newWarrior) {
        r.treasury -= RECRUIT_COST;
        r.roster.push(newWarrior);
        const adaptQuote = META_RECRUIT_QUOTES[adaptation] ?? '"A new warrior joins."';
        gazetteItems.push(
          `📢 ${r.owner.stableName} recruits ${newWarrior.name} (${newWarrior.style}) — ${adaptQuote}`
        );
      }
    }

    r.roster = filterActive(r.roster);
    return r;
  });

  return { updatedRivals, gazetteItems };
}
