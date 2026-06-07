import type { GameState, Season } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { RNGContext } from '@/engine/core/rng/RNGContext';
import { StateImpact } from '@/engine/impacts';
import { processHallOfFame, createYearlySnapshots } from '../core/hallOfFame';
import { processTierProgression } from '../core/tierProgression';
import { WorldManagementService } from '@/engine/ai/worldManagement';
import { evolvePhilosophies } from '@/engine/ownerPhilosophy';
import { generateOwnerNarratives } from '@/engine/ownerNarrative';
import { BankruptcyService } from '@/engine/ai/bankruptcyService';
import { computeNextSeason } from './WorldPass';

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
    seasonalGrowth: state.seasonalGrowth ? [...state.seasonalGrowth] : [],
  };
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
    const { news } = WorldManagementService.processSeasonalChurn(state, rngContext);

    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(
      state,
      nextSeason,
      rngContext.getRNG()
    );
    const narrGazette = generateOwnerNarratives(state, nextSeason, rngContext.getRNG());

    impact.rivalsUpdates = new Map();
    philRivals.forEach((r) => {
      if (impact.rivalsUpdates) impact.rivalsUpdates.set(r.id, r);
    });

    const combinedNews = [...news, ...gazetteItems, ...narrGazette];
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
    const rivalDecayMap = impact.rivalsUpdates ?? new Map();
    for (const r of state.rivals) {
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
 * Stable Lords — System & Season Pipeline Pass
 * Bundles systemic updates like Hall of Fame, Tier Progression, and AI Seasonal Churn.
 */
export function runSystemPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const nextWeek = state.week + 1 > 52 ? 1 : state.week + 1;
  const nextYear = nextWeek === 1 ? state.year + 1 : state.year;
  const rng = rootRng || new SeededRNGService(state.week * 881 + 17);

  // 1. Systemic Progression (Draft-heavy)
  const impact = processSystemicProgression(state, nextWeek, nextYear);

  // 2. Player Bankruptcy Check (after economy pass)
  const bankruptcyResult = BankruptcyService.processPlayerBankruptcy(state, rng);
  if (bankruptcyResult.bankrupt) {
    Object.assign(impact, bankruptcyResult.impact);
  }

  // 3. Seasonal Churn & AI Philosophy Evolution
  const nextSeason = computeNextSeason(nextWeek);
  processSeasonalChurnAndPhilosophy(state, nextWeek, nextSeason, impact, rng);

  // 4. Weekly fame / popularity decay
  applyWeeklyPrestigeDecay(state, impact);

  return impact;
}
