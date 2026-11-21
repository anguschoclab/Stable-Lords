import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { StateImpact } from '../impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { getHealingTrainerBonus } from '@/engine/training/coachLogic';
import { tickStableHealth } from './stableHealth';

/**
 * Health Impact calculation — extracted from the legacy pipeline.
 * Processes injury ticks and recovers rested status.
 * V30: consumes the shared tickStableHealth ruleset — fatigue decay, the
 * baseline injury tick, and accelerated healing for 'recovery' assignments
 * all run through the same implementation the rival stables use.
 */
export function computeHealthImpact(state: GameState, rngService?: IRNGService): StateImpact {
  const injuryNews: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rng = resolveRng(rngService, state.week);

  const recoveryWarriorIds = new Set<WarriorId>(
    (state.trainingAssignments ?? [])
      .filter((a) => a.type === 'recovery')
      .map((a) => a.warriorId)
  );
  const healingBonus = getHealingTrainerBonus(state.trainers ?? []);

  const originalById = new Map<WarriorId, Warrior>();
  for (const w of state.roster) originalById.set(w.id, w);
  const { warriors, healed } = tickStableHealth({
    warriors: state.roster,
    recoveryWarriorIds,
    healingBonus,
  });

  for (const w of warriors) {
    const orig = originalById.get(w.id);
    if (w === orig || !orig) continue;
    // Only-changed-fields delta — an unconditional injuries write could
    // clobber a parallel training delta on the merged impact.
    const delta: Partial<Warrior> = {};
    if (w.fatigue !== orig.fatigue) delta.fatigue = w.fatigue;
    if (w.injuries !== orig.injuries) delta.injuries = w.injuries;
    rosterUpdates.set(w.id, delta);
    const names = healed.get(w.id);
    if (names && names.length > 0) {
      injuryNews.push(`${warriorDisplayName(w)} recovered from ${names.join(', ')}.`);
    }
  }

  return {
    rosterUpdates,
    newsletterItems:
      injuryNews.length > 0
        ? [{ id: rng.uuid(), week: state.week, title: 'The Infirmary Report', items: injuryNews }]
        : [],
  };
}
