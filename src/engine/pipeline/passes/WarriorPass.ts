import type { GameState } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { computeTrainingImpact, trainingImpactToStateImpact } from '@/engine/training';
import { computeAgingImpact } from '@/engine/aging';
import { computeHealthImpact } from '@/engine/warrior/health';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { convertRetiredToTrainer } from '@/engine/trainers/trainers';
import { LEGACY_FOUNDER_FAME_MIN, LEGACY_FOUNDER_TRAINER_CHANCE } from '@/constants/world';

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState, rng: IRNGService): StateImpact {
  const trainingImpactRaw = computeTrainingImpact(state, rng, state.weather);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(
    state,
    trainingImpactRaw,
    rng
  );

  const agingImpact = computeAgingImpact(state, rng);

  // 🧬 Legacy System: founder-caliber retirees either join the founder queue
  // (decided inside computeAgingImpact) or convert to hiring-pool trainers —
  // never both. The queue ids are the explicit double-claim guard.
  const founderClaimed = new Set(
    [...(state.legacyFounderQueue ?? []), ...(agingImpact.legacyFounderEnqueue ?? [])].map(
      (w) => w.id
    )
  );
  const newTrainersInPool: Trainer[] = [];
  if (agingImpact.retired && agingImpact.retired.length > 0) {
    agingImpact.retired.forEach((w) => {
      if (founderClaimed.has(w.id)) return;
      if ((w.fame ?? 0) <= LEGACY_FOUNDER_FAME_MIN) return;
      if (rng.next() < LEGACY_FOUNDER_TRAINER_CHANCE) {
        newTrainersInPool.push(convertRetiredToTrainer(w));
      }
    });
  }

  const impacts: StateImpact[] = [trainingImpact, agingImpact, computeHealthImpact(state)];

  if (newTrainersInPool.length > 0) {
    impacts.push({ hiringPool: [...(state.hiringPool || []), ...newTrainersInPool] });
  }

  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    impacts.push({ seasonalGrowth: [...seasonalGrowth] });
  }

  return mergeImpacts(impacts);
}
