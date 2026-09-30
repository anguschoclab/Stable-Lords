import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getRecentFightsForWarrior } from '@/engine/core/historyUtils';
import { resolveRng } from '@/utils/random';
import { computeWarriorLiability } from '@/engine/warrior/warriorValue';
import { policyFor } from '@/engine/ai/traitPolicy';
import { aiRosterMin } from '@/constants/ai';
import { isActive, isRetired } from '@/engine/warrior/warriorStatus';
import { retireWithHonors } from '@/engine/warrior/retirement';
import { filterActive } from '@/utils/roster';
import { warriorDisplayName } from '@/utils/warriorDisplay';

/**
 * Manages the roster of AI owners by evaluating current warriors, recruiting talent,
 * and releasing underperforming assets based on current owner personality and budget.
 *
 * @param state - The current game state
 * @param rng - Optional RNG service
 * @returns Updated rivals list and gazette news items
 */
/**
 * Runs the culling/retirement pass for a single rival, mutates the cloned
 * rival `r`, and appends gazette items. Returns the cull count and pushes
 * each culled warrior into `retiredWarriors` so the caller can route them
 * to `state.retired` — culled warriors leave a record, they don't vanish.
 * Reigning champions are never culled: the crown protects them from
 * personality and liability cuts alike (voluntary exits flow through the
 * relinquish path).
 */
function cullRivalRoster(
  r: RivalStableData,
  state: GameState,
  isOnWinStreak: (w: Warrior) => boolean,
  rngSnapshot: IRNGService,
  gazetteItems: string[],
  retiredWarriors: Warrior[],
  championIds: Set<string>
): number {
  const personality = r.owner.personality ?? 'Pragmatic';
  let culledThisTick = 0;

  const retire = (w: Warrior) => {
    Object.assign(w, retireWithHonors(w, state.week));
    retiredWarriors.push({ ...w });
    culledThisTick++;
  };

  // Methodical/Tactician owners cull underperformers
  if (personality === 'Methodical' || personality === 'Tactician') {
    cullWhere(
      r,
      (w) =>
        w.career.wins + w.career.losses >= 5 &&
        w.career.wins / Math.max(1, w.career.wins + w.career.losses) < 0.3 &&
        (w.age ?? 18) >= 25,
      isOnWinStreak,
      retire,
      gazetteItems,
      (c) =>
        `📋 ${r.owner.name} (${r.owner.stableName}) retires ${warriorDisplayName(c)} — "Not meeting expectations."`,
      championIds
    );
  }

  // Aggressive owners cull warriors with 0 kills after many fights
  if (personality === 'Aggressive') {
    cullWhere(
      r,
      (w) =>
        w.career.kills === 0 &&
        w.career.wins + w.career.losses >= 8 &&
        (w.age ?? 18) >= 24,
      isOnWinStreak,
      retire,
      gazetteItems,
      (c) =>
        `🗡️ ${r.owner.name} (${r.owner.stableName}) cuts ${warriorDisplayName(c)} — "No killer instinct."`,
      championIds
    );
  }

  // Liability-based culling: release flaw-loaded warriors per personality threshold
  const traitPolicy = policyFor(r.owner.personality);
  cullWhere(
    r,
    (w) => {
      const liability = computeWarriorLiability(w);
      return (
        liability.score >= traitPolicy.cutLiabilityThreshold ||
        liability.recommendation === 'Release'
      );
    },
    isOnWinStreak,
    retire,
    gazetteItems,
    (c) => `📋 ${r.owner.name} (${r.owner.stableName}) releases ${warriorDisplayName(c)} — too many flaws.`,
    championIds
  );

  retireElderlyWarrior(r, state, rngSnapshot, gazetteItems, retiredWarriors, championIds);

  return culledThisTick;
}

/** 15% weekly chance the oldest active non-champion (age 30+) retires of age. */
function retireElderlyWarrior(
  r: RivalStableData,
  state: GameState,
  rngSnapshot: IRNGService,
  gazetteItems: string[],
  retiredWarriors: Warrior[],
  championIds: Set<string>
): void {
  const elderly = r.roster.filter(
    (w) => isActive(w) && !championIds.has(w.id) && (w.age ?? 18) >= 30
  );
  for (const old of elderly.slice(0, 1)) {
    if (rngSnapshot.next() < 0.15) {
      Object.assign(old, retireWithHonors(old, state.week));
      retiredWarriors.push({ ...old });
      gazetteItems.push(
        `🏠 ${warriorDisplayName(old)} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`
      );
    }
  }
}

/** Retire the first active, non-streaking, non-champion warrior matching `matches`; log it. */
function cullWhere(
  r: RivalStableData,
  matches: (w: Warrior) => boolean,
  isOnWinStreak: (w: Warrior) => boolean,
  retire: (w: Warrior) => void,
  gazetteItems: string[],
  describe: (w: Warrior) => string,
  championIds: Set<string>
): void {
  const candidates = r.roster.filter(
    (w) => isActive(w) && !isOnWinStreak(w) && !championIds.has(w.id) && matches(w)
  );
  for (const c of candidates.slice(0, 1)) {
    retire(c);
    gazetteItems.push(describe(c));
  }
}

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
): { updatedRivals: RivalStableData[]; gazetteItems: string[]; retiredWarriors: Warrior[] } {
  const rngSnapshot = resolveRng(rng, (state.absoluteWeek ?? state.week) * 7919 + 101);
  const gazetteItems: string[] = [];
  const retiredWarriors: Warrior[] = [];

  // Reigning champions are immune to culling — a stable does not cut its
  // titleholder. (Same deferral rule as agingSystem/seasonalRetirementService.)
  const championIds = new Set(
    Object.values(state.arenaChampions ?? {})
      .map((t) => t.champion?.warriorId)
      .filter((id): id is NonNullable<typeof id> => id != null)
  );

  const updatedRivals = (state.rivals || []).map((rival) => {
    const r = {
      ...rival,
      roster: rival.roster.map((w) => ({ ...w, career: { ...w.career } })),
      owner: { ...rival.owner },
    };

    const personality = r.owner.personality ?? 'Pragmatic';

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

    // 1) Retirement / Culling Logic
    const culledThisTick = cullRivalRoster(
      r,
      state,
      isOnWinStreak,
      rngSnapshot,
      gazetteItems,
      retiredWarriors,
      championIds
    );

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

    // Preserve every warrior leaving the roster in a Retired state —
    // culls from this pass plus retirements applied upstream (seasonal churn,
    // aging) that were sitting on the roster with status 'Retired'. Without
    // this, retired warriors silently vanish instead of reaching
    // state.retired.
    const seen = new Set(retiredWarriors.map((w) => w.id));
    for (const w of r.roster) {
      if (isRetired(w) && !seen.has(w.id)) retiredWarriors.push(w);
    }

    r.roster = filterActive(r.roster);
    return r;
  });

  return { updatedRivals, gazetteItems, retiredWarriors };
}
