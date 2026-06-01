import type { GameState, Trainer, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { TRAINER_AGING, RETIREMENT_CHANCES } from '@/constants/aging';

/**
 * Trainer Aging System
 *
 * - Trainers age +1 year every 52 weeks.
 * - Legend Protection: High fame and retired warriors stay longer.
 * - Base retirement chance starts at age 65.
 */
export function computeTrainerAging(
  state: GameState,
  rng?: IRNGService
): {
  updatedTrainers: Trainer[];
  news: string[];
  updatedHiringPool: Trainer[];
  rivalsUpdates: Map<StableId, Partial<RivalStableData>>;
} {
  const rngService = rng || new SeededRNGService(state.week * 1337 + 7);
  const news: string[] = [];
  const isAgingWeek = state.week % TRAINER_AGING.WEEKS_PER_YEAR === 0;

  const processAging = (trainers: Trainer[], isActive: boolean) => {
    const kept: Trainer[] = [];
    for (let t of trainers || []) {
      let currentAge = t.age ?? TRAINER_AGING.BASE_AGE;
      if (isAgingWeek) currentAge++;

      // ── Contract expiration (active trainers only) ──
      if (isActive) {
        const weeksLeft = t.contractWeeksLeft - 1;
        if (weeksLeft <= 0) {
          news.push(`CONTRACT: ${t.name}'s contract has expired and they have left the stable.`);
          continue; // Remove from active trainers
        }
        t = { ...t, contractWeeksLeft: weeksLeft };
      }

      let retired = false;
      if (currentAge >= TRAINER_AGING.RETIREMENT_START) {
        const baseChance =
          RETIREMENT_CHANCES.BASE +
          (currentAge - TRAINER_AGING.RETIREMENT_START) * RETIREMENT_CHANCES.AGE_INCREMENT;

        const fameDiscount = Math.min(
          RETIREMENT_CHANCES.FAME_DISCOUNT_MAX,
          (t.fame || 0) * 0.001
        );

        const legacyDiscount = t.retiredFromWarrior ? RETIREMENT_CHANCES.LEGACY_DISCOUNT : 0;

        const finalChance = Math.max(RETIREMENT_CHANCES.MIN_CHANCE, baseChance - fameDiscount - legacyDiscount);

        if (rngService.next() < finalChance) {
          retired = true;
          const verb =
            currentAge > TRAINER_AGING.DEATH_THRESHOLD
              ? 'passed away peacefully'
              : 'retired to the countryside';
          news.push(`LEGACY: ${t.name} (${t.focus} Trainer) has ${verb} at age ${currentAge}.`);
        }
      }

      if (!retired) {
        kept.push({ ...t, age: currentAge });
      }
    }
    return kept;
  };

  const updatedTrainers = processAging(state.trainers, true);
  const updatedHiringPool = processAging(state.hiringPool, false);

  // ── Process rival trainers ──
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  for (const rival of state.rivals || []) {
    const rivalTrainers = rival.trainers || [];
    const updatedRivalTrainers = processAging(rivalTrainers, true);
    const changed =
      updatedRivalTrainers.length !== rivalTrainers.length ||
      updatedRivalTrainers.some((t, i) => {
        const orig = rivalTrainers[i];
        return !orig || t.age !== orig.age || t.contractWeeksLeft !== orig.contractWeeksLeft;
      });
    if (changed) {
      rivalsUpdates.set(rival.id, { trainers: updatedRivalTrainers });
    }
  }

  return { updatedTrainers, news, updatedHiringPool, rivalsUpdates };
}
