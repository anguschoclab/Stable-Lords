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
import {
  isLegacyFounderCaliber,
  buildLegacyFounderQueueEntry,
  collectCrownedWarriorIds,
} from '@/engine/ai/legacyFounder';
import { LEGACY_FOUND_CHANCE } from '@/constants/world';

interface CullRivalRosterArgs {
  r: RivalStableData;
  state: GameState;
  isOnWinStreak: (w: Warrior) => boolean;
  rngSnapshot: IRNGService;
  gazetteItems: string[];
  retiredWarriors: Warrior[];
  championIds: Set<string>;
  founderQueue: Warrior[];
  crownedIds: Set<string>;
}

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
function cullRivalRoster(args: CullRivalRosterArgs): number {
  const { r, state, isOnWinStreak, rngSnapshot, gazetteItems } = args;
  const { retiredWarriors, championIds, founderQueue, crownedIds } = args;
  const personality = r.owner.personality ?? 'Pragmatic';
  let culledThisTick = 0;

  const retire = (w: Warrior) => {
    Object.assign(w, retireWithHonors(w, state.week));
    retiredWarriors.push({ ...w });
    if (isLegacyFounderCaliber(w, crownedIds) && rngSnapshot.next() < LEGACY_FOUND_CHANCE) {
      founderQueue.push(buildLegacyFounderQueueEntry(w));
    }
    culledThisTick++;
  };

  cullByPersonality({ r: r, personality: personality, isOnWinStreak: isOnWinStreak, retire: retire, gazetteItems: gazetteItems, championIds: championIds });

  // Liability-based culling: release flaw-loaded warriors per personality threshold
  const traitPolicy = policyFor(r.owner.personality);
  cullWhere(
    { r: r, matches: (w) => {
      const liability = computeWarriorLiability(w);
      return (
        liability.score >= traitPolicy.cutLiabilityThreshold ||
        liability.recommendation === 'Release'
      );
    }, isOnWinStreak: isOnWinStreak, retire: retire, gazetteItems: gazetteItems, describe: (c) =>
      `📋 ${r.owner.name} (${r.owner.stableName}) releases ${warriorDisplayName(c)} — too many flaws.`, championIds: championIds }
  );

  retireElderlyWarrior(
    { r: r, state: state, rngSnapshot: rngSnapshot, gazetteItems: gazetteItems, retiredWarriors: retiredWarriors, championIds: championIds, founderQueue: founderQueue, crownedIds: crownedIds }
  );

  return culledThisTick;
}

interface RetireElderlyWarriorArgs {
  r: RivalStableData;
  state: GameState;
  rngSnapshot: IRNGService;
  gazetteItems: string[];
  retiredWarriors: Warrior[];
  championIds: Set<string>;
  founderQueue: Warrior[];
  crownedIds: Set<string>;
}

/** 15% weekly chance the oldest active non-champion (age 30+) retires of age. */
function retireElderlyWarrior(args: RetireElderlyWarriorArgs): void {
  const { r, state, rngSnapshot, gazetteItems, retiredWarriors } = args;
  const { championIds, founderQueue, crownedIds } = args;
  const elderly = r.roster.filter(
    (w) => isActive(w) && !championIds.has(w.id) && (w.age ?? 18) >= 30
  );
  for (const old of elderly.slice(0, 1)) {
    if (rngSnapshot.next() < 0.15) {
      Object.assign(old, retireWithHonors(old, state.week));
      retiredWarriors.push({ ...old });
      if (isLegacyFounderCaliber(old, crownedIds) && rngSnapshot.next() < LEGACY_FOUND_CHANCE) {
        founderQueue.push(buildLegacyFounderQueueEntry(old));
      }
      gazetteItems.push(
        `🏠 ${warriorDisplayName(old)} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`
      );
    }
  }
}

interface CullByPersonalityArgs {
  r: RivalStableData;
  personality: string;
  isOnWinStreak: (w: Warrior) => boolean;
  retire: (w: Warrior) => void;
  gazetteItems: string[];
  championIds: Set<string>;
}

/** Personality culls: Methodical/Tactician cut underperformers; Aggressive
 *  cuts warriors with no killer instinct. */
function cullByPersonality(args: CullByPersonalityArgs): void {
  const { r, personality, isOnWinStreak, retire, gazetteItems } = args;
  const { championIds } = args;
  if (personality === 'Methodical' || personality === 'Tactician') {
    cullWhere(
      { r: r, matches: (w) =>
        w.career.wins + w.career.losses >= 5 &&
        w.career.wins / Math.max(1, w.career.wins + w.career.losses) < 0.3 &&
        (w.age ?? 18) >= 25, isOnWinStreak: isOnWinStreak, retire: retire, gazetteItems: gazetteItems, describe: (c) =>
        `📋 ${r.owner.name} (${r.owner.stableName}) retires ${warriorDisplayName(c)} — "Not meeting expectations."`, championIds: championIds }
    );
  }

  if (personality === 'Aggressive') {
    cullWhere(
      { r: r, matches: (w) => w.career.kills === 0 && w.career.wins + w.career.losses >= 8 && (w.age ?? 18) >= 24, isOnWinStreak: isOnWinStreak, retire: retire, gazetteItems: gazetteItems, describe: (c) =>
        `🗡️ ${r.owner.name} (${r.owner.stableName}) cuts ${warriorDisplayName(c)} — "No killer instinct."`, championIds: championIds }
    );
  }
}

interface CullWhereArgs {
  r: RivalStableData;
  matches: (w: Warrior) => boolean;
  isOnWinStreak: (w: Warrior) => boolean;
  retire: (w: Warrior) => void;
  gazetteItems: string[];
  describe: (w: Warrior) => string;
  championIds: Set<string>;
}

/** Retire the first active, non-streaking, non-champion warrior matching `matches`; log it. */
function cullWhere(args: CullWhereArgs): void {
  const { r, matches, isOnWinStreak, retire, gazetteItems } = args;
  const { describe, championIds } = args;
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
): {
  updatedRivals: RivalStableData[];
  gazetteItems: string[];
  retiredWarriors: Warrior[];
  legacyFounders: Warrior[];
} {
  const rngSnapshot = resolveRng(rng, (state.absoluteWeek ?? state.week) * 7919 + 101);
  const gazetteItems: string[] = [];
  const retiredWarriors: Warrior[] = [];
  const legacyFounders: Warrior[] = [];

  // Reigning champions are immune to culling — a stable does not cut its
  // titleholder. (Same deferral rule as agingSystem/seasonalRetirementService.)
  const championIds = new Set(
    Object.values(state.arenaChampions ?? {})
      .map((t) => t.champion?.warriorId)
      .filter((id): id is NonNullable<typeof id> => id != null)
  );
  // Past or present crown-holders are founder caliber when they retire.
  const crownedIds = collectCrownedWarriorIds(state);

  const updatedRivals = (state.rivals || []).map((rival) =>
    manageOneRival(
      { rival: rival, state: state, rngSnapshot: rngSnapshot, gazetteItems: gazetteItems, retiredWarriors: retiredWarriors, legacyFounders: legacyFounders, championIds: championIds, crownedIds: crownedIds }
    )
  );

  return { updatedRivals, gazetteItems, retiredWarriors, legacyFounders };
}

/**
 * Trajectory guard: warriors on a hot streak (3+ wins in last 5 fights) are
 * protected from any personality-based culling regardless of career win-rate.
 */
function winStreakGuard(arenaHistory: GameState['arenaHistory']) {
  return (w: Warrior) => {
    const total = w.career.wins + w.career.losses;
    if (total < 5) return false;
    const wId = w.id;
    const recentFights = getRecentFightsForWarrior(arenaHistory, wId, 5);
    const recentWins = recentFights.filter(
      (f) =>
        (f.warriorIdA === wId && f.winner === 'A') || (f.warriorIdD === wId && f.winner === 'D')
    ).length;
    return recentWins >= 3;
  };
}

interface ManageOneRivalArgs {
  rival: RivalStableData;
  state: GameState;
  rngSnapshot: IRNGService;
  gazetteItems: string[];
  retiredWarriors: Warrior[];
  legacyFounders: Warrior[];
  championIds: Set<string>;
  crownedIds: Set<string>;
}

/**
 * Per-rival roster management: cull/retire, flag `needsRecruit`, then
 * preserve every warrior leaving the roster in a Retired state — culls from
 * this pass plus retirements applied upstream (seasonal churn, aging) that
 * were sitting on the roster with status 'Retired'. Without this, retired
 * warriors silently vanish instead of reaching `state.retired`.
 */
function manageOneRival(args: ManageOneRivalArgs): RivalStableData {
  const { rival, state, rngSnapshot, gazetteItems, retiredWarriors } = args;
  const { legacyFounders, championIds, crownedIds } = args;
  const r = {
    ...rival,
    roster: rival.roster.map((w) => ({ ...w, career: { ...w.career } })),
    owner: { ...rival.owner },
  };

  const personality = r.owner.personality ?? 'Pragmatic';
  const isOnWinStreak = winStreakGuard(state.arenaHistory);

  // 1) Retirement / Culling Logic
  const culledThisTick = cullRivalRoster(
    { r: r, state: state, isOnWinStreak: isOnWinStreak, rngSnapshot: rngSnapshot, gazetteItems: gazetteItems, retiredWarriors: retiredWarriors, championIds: championIds, founderQueue: legacyFounders, crownedIds: crownedIds }
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

  const seen = new Set(retiredWarriors.map((w) => w.id));
  const queued = new Set((state.legacyFounderQueue ?? []).map((w) => w.id));
  for (const w of r.roster) {
    if (isRetired(w) && !seen.has(w.id)) {
      retiredWarriors.push(w);
      if (
        !queued.has(w.id) &&
        !legacyFounders.some((f) => f.id === w.id) &&
        isLegacyFounderCaliber(w, crownedIds) &&
        rngSnapshot.next() < LEGACY_FOUND_CHANCE
      ) {
        legacyFounders.push(buildLegacyFounderQueueEntry(w));
      }
    }
  }

  r.roster = filterActive(r.roster);
  return r;
}
