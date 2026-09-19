import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getRecentFightsForWarrior } from '@/engine/core/historyUtils';
import { resolveRng } from '@/utils/random';
import { computeWarriorLiability } from '@/engine/warriorValue';
import { policyFor } from '@/engine/ai/traitPolicy';
import { aiRosterMin } from '@/constants/ai';
import { isActive } from '@/engine/warriorStatus';

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
  const rngSnapshot = resolveRng(rng, state.week * 7919 + 101);
  const gazetteItems: string[] = [];
  const updatedRivals = (state.rivals || []).map((rival) => {
    const r = {
      ...rival,
      roster: rival.roster.map((w) => ({ ...w, career: { ...w.career } })),
      owner: { ...rival.owner },
    };

    const personality = r.owner.personality ?? 'Pragmatic';

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
      const candidates = r.roster.filter(
        (w) =>
          isActive(w) &&
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
      const killless = r.roster.filter(
        (w) =>
          isActive(w) &&
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
    const liabilityCandidates = r.roster.filter((w) => {
      if (w.status !== 'Active') return false;
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
    const elderly = r.roster.filter((w) => isActive(w) && (w.age ?? 18) >= 30);
    for (const old of elderly.slice(0, 1)) {
      if (rngSnapshot.next() < 0.15) {
        old.status = 'Retired';
        old.retiredWeek = state.week;
        gazetteItems.push(
          `🏠 ${old.name} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`
        );
      }
    }

    // 2) Recruitment flag — signing is unified in aiDraftFromPool /
    // processRecruitment (G9). Management only declares the need; the draft
    // path owns caps, budgets, and pool-vs-generated sourcing.
    let currentActive = 0;
    for (const w of r.roster) {
      if (isActive(w)) currentActive++;
    }
    const intent = r.strategy?.intent ?? 'CONSOLIDATION';
    r.needsRecruit =
      currentActive < aiRosterMin(personality) && culledThisTick === 0 && intent !== 'RECOVERY';

    r.roster = r.roster.filter((w) => isActive(w));
    return r;
  });

  return { updatedRivals, gazetteItems };
}
