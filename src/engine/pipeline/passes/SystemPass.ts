import type { GameState, Season, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService, resolveRng } from '@/utils/random';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { RNGContext } from '@/engine/core/rng/RNGContext';
import { StateImpact } from '@/engine/impacts';
import {
  processHallOfFame,
  createYearlySnapshots,
  recordWeeklyHallOfFame,
} from '../core/hallOfFame';
import { processTierProgression } from '../core/tierProgression';
import { WorldManagementService, diffRivalMembership } from '@/engine/ai/worldManagement';
import { warriorToPoolWarrior } from '@/engine/recruitment/recruitment';
import { evolvePhilosophies } from '@/engine/owner/philosophy';
import { generateOwnerNarratives } from '@/engine/owner/narrative';
import { BankruptcyService } from '@/engine/ai/bankruptcyService';
import { computeNextSeason } from './WorldPass';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { generateArchetypeAttrs, STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { generateWarriorName } from '@/data/names/nameGenerator';
import { collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { WarriorId } from '@/types/shared.types';

/**
 * Stable Lords — System & Season Pipeline Pass
 * Bundles systemic updates like Hall of Fame, Tier Progression, and AI Seasonal Churn.
 */
/**
 * Helper to process systemic progression, including hall of fame, snapshots, and tier progressions.
 */
function processSystemicProgression(
  state: GameState,
  nextWeek: number,
  nextYear: number
): StateImpact {
  const hofImpact = processHallOfFame(state, nextWeek);
  const weeklyHofImpact = recordWeeklyHallOfFame(state);

  let snapshotImpact: StateImpact = {};
  const isFirstTick = state.week === 1 && state.year === 1;
  const isYearTransition = nextWeek === 1 && state.year >= 1;
  const needsInitialSnapshot = isFirstTick && !state.roster.some((w) => w.yearlySnapshots?.[1]);

  if (isYearTransition || needsInitialSnapshot) {
    snapshotImpact = createYearlySnapshots(state, nextYear);
  }

  const tierImpact = processTierProgression(state, state.season, nextWeek);

  return {
    ...hofImpact,
    ...snapshotImpact,
    ...tierImpact,
    ...weeklyHofImpact,
    seasonalGrowth: state.seasonalGrowth ? [...state.seasonalGrowth] : [],
  };
}

/**
 * Wire seasonal churn results into the impact: stable removals/additions and
 * the displaced-roster free agents. Without this the churn result was a dead
 * write — bankrupt stables stayed live and expansion stables never arrived.
 */
function applySeasonalChurnMembership(
  state: GameState,
  churnedRivals: RivalStableData[],
  nextWeek: number,
  seasonSeed: number,
  impact: StateImpact
): void {
  const churn = diffRivalMembership(state.rivals ?? [], churnedRivals);
  if (churn.removedIds.length > 0) {
    impact.rivalsRemovals = [...(impact.rivalsRemovals ?? []), ...churn.removedIds];
  }
  if (churn.additions.length > 0) {
    impact.rivalsAdditions = [...(impact.rivalsAdditions ?? []), ...churn.additions];
  }
  // Displaced warriors survive as free agents; the already-retired join the
  // retired roll; the dead stay in the graveyard.
  const displaced = churn.removedRosters.flat();
  const veterans = displaced.filter((w) => w.status === 'Active');
  const lateRetirees = displaced.filter((w) => w.status === 'Retired');
  if (veterans.length > 0) {
    const poolRng = new SeededRNGService(seasonSeed + 77);
    impact.recruitPool = [
      ...(impact.recruitPool ?? state.recruitPool ?? []),
      ...veterans.map((w) => warriorToPoolWarrior(w, nextWeek, poolRng)),
    ];
  }
  if (lateRetirees.length > 0) {
    impact.retired = [...(impact.retired ?? []), ...lateRetirees];
  }
}

/**
 * Helper to process seasonal churn and evolution of AI philosophies on season change.
 */
function processSeasonalChurnAndPhilosophy(
  state: GameState,
  nextWeek: number,
  nextSeason: Season,
  impact: StateImpact,
  rng: IRNGService
): void {
  const nextSeasonName = computeNextSeason(nextWeek);
  const prevSeason = state.season;
  if (prevSeason !== nextSeasonName) {
    const seasonSeed = nextWeek * 133;
    const rngContext = new RNGContext(seasonSeed + 55);
    // Churn returns the post-season rival world — wire it into the impact.
    const { updatedRivals: churnedRivals, news } = WorldManagementService.processSeasonalChurn(
      state,
      rngContext
    );
    applySeasonalChurnMembership(state, churnedRivals, nextWeek, seasonSeed, impact);

    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(
      { ...state, rivals: churnedRivals },
      nextSeason,
      rngContext.getRNG()
    );
    const narrGazette = generateOwnerNarratives(state, nextSeason, rngContext.getRNG());

    // Season points race winner — warriors still hold the completed season's
    // points here; the reset happens post-passes in weekPipelineService.
    let pointsLeader: Warrior | undefined;
    const consider = (w: Warrior) => {
      if ((w.seasonPoints ?? 0) > (pointsLeader?.seasonPoints ?? 0)) pointsLeader = w;
    };
    state.roster.forEach(consider);
    state.rivals.forEach((r) => r.roster.forEach(consider));
    const pointsNews =
      pointsLeader && (pointsLeader.seasonPoints ?? 0) > 0
        ? [
            `🏅 POINTS RACE: ${warriorDisplayName(pointsLeader)} tops the ${prevSeason} standings with ${pointsLeader.seasonPoints} season points.`,
          ]
        : [];

    impact.rivalsUpdates = new Map();
    philRivals.forEach((r) => {
      if (impact.rivalsUpdates) impact.rivalsUpdates.set(r.id, r);
    });

    const combinedNews = [...news, ...gazetteItems, ...narrGazette, ...pointsNews];
    if (combinedNews.length > 0) {
      const existingItems = impact.newsletterItems || [];
      impact.newsletterItems = [
        ...existingItems,
        {
          id: rng.uuid('newsletter'),
          week: nextWeek,
          title: `${state.season} Season Summary`,
          items: combinedNews,
        },
      ];
    }
  }
}

/**
 * Helper to apply the weekly decay rate to player and rival fame/prestige.
 */
function applyWeeklyPrestigeDecay(state: GameState, impact: StateImpact): void {
  const DECAY_RATE = 0.0133;
  const decayAmount = (v: number) => Math.max(0, Math.floor(v * DECAY_RATE));
  const playerFameLoss = decayAmount(state.fame ?? 0);
  const playerPopLoss = decayAmount(state.popularity ?? 0);
  if (playerFameLoss > 0) {
    impact.fameDelta = (impact.fameDelta ?? 0) - playerFameLoss;
  }
  if (playerPopLoss > 0) {
    impact.popularityDelta = (impact.popularityDelta ?? 0) - playerPopLoss;
  }

  if (state.rivals && state.rivals.length > 0) {
    // Stables already marked for removal this tick must not accrue updates.
    const removedIds = new Set<string>(impact.rivalsRemovals ?? []);
    const rivalDecayMap = impact.rivalsUpdates ?? new Map();
    for (const r of state.rivals) {
      if (removedIds.has(r.id)) continue;
      const loss = decayAmount(r.fame ?? 0);
      if (loss <= 0) continue;
      const prev = rivalDecayMap.get(r.id) ?? {};
      rivalDecayMap.set(r.id, { ...prev, fame: Math.max(0, (prev.fame ?? r.fame) - loss) });
    }
    if (rivalDecayMap.size > 0) {
      impact.rivalsUpdates = rivalDecayMap;
    }
  }
}

/**
 * Materialize a floor recruit: convert a PoolWarrior to a full Warrior, or
 * generate one from scratch if the recruit pool is empty.
 */
function materializeFloorRecruit(
  state: GameState,
  rng: IRNGService
): { warrior: Warrior; updatedPool?: PoolWarrior[] } | null {
  if (state.recruitPool && state.recruitPool.length > 0) {
    const poolWarrior = state.recruitPool[0];
    if (!poolWarrior) return null;
    const warrior: Warrior = {
      ...poolWarrior,
      id: poolWarrior.id as WarriorId,
      fame: 0,
      popularity: 0,
      titles: [],
      injuries: [],
      flair: [],
      career: { wins: 0, losses: 0, kills: 0 },
      champion: false,
      status: 'Active',
      equipment: getFittedLoadout(poolWarrior.style, poolWarrior.attributes),
      stableId: state.player?.id,
    } as unknown as Warrior;
    return { warrior, updatedPool: state.recruitPool.slice(1) };
  }

  const style = rng.pick(Object.values(FightingStyle));
  const attrs = generateArchetypeAttrs(style, rng);
  const warrior = makeWarrior(
    rng.uuid() as WarriorId,
    generateWarriorName({
      rng,
      archetype: STYLE_ARCHETYPE[style],
      usedNames: collectUsedWarriorNames(state),
    }),
    style,
    attrs,
    {},
    rng
  );
  return { warrior };
}

/**
 * Stable Lords — System & Season Pipeline Pass
 * Bundles systemic updates like Hall of Fame, Tier Progression, and AI Seasonal Churn.
 */
export function runSystemPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const nextWeek = state.week + 1 > 52 ? 1 : state.week + 1;
  const nextYear = nextWeek === 1 ? state.year + 1 : state.year;
  const rng = resolveRng(rootRng, (state.absoluteWeek ?? state.week) * 881 + 17);

  // 1. Systemic Progression (Draft-heavy)
  const impact = processSystemicProgression(state, nextWeek, nextYear);

  // 2. Player Bankruptcy Check (after economy pass)
  const bankruptcyResult = BankruptcyService.processPlayerBankruptcy(state, rng);
  if (bankruptcyResult.bankrupt) {
    Object.assign(impact, bankruptcyResult.impact);
  }

  // 2b. Player Roster Floor — auto-recruit if effective roster is empty
  const bankruptcyRemovals = bankruptcyResult.impact.rosterRemovals?.length ?? 0;
  const effectiveRosterSize = state.roster.length - bankruptcyRemovals;
  if (effectiveRosterSize < 1) {
    const floorRng = new SeededRNGService((state.absoluteWeek ?? state.week) * 6151 + 29);
    const recruit = materializeFloorRecruit(state, floorRng);
    if (recruit) {
      impact.rosterAdditions = [...(impact.rosterAdditions ?? []), recruit.warrior];
      if (recruit.updatedPool) {
        impact.recruitPool = recruit.updatedPool;
      }
    }
  }

  // 3. Seasonal Churn & AI Philosophy Evolution
  const nextSeason = computeNextSeason(nextWeek);
  processSeasonalChurnAndPhilosophy(state, nextWeek, nextSeason, impact, rng);

  // 4. Weekly fame / popularity decay
  applyWeeklyPrestigeDecay(state, impact);

  return impact;
}
