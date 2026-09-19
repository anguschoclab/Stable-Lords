import type { GameState } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { tickInjuries } from '@/engine/injuries';
import type { StateImpact } from './impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';

/**
 * Health Impact calculation — extracted from the legacy pipeline.
 * Processes injury ticks and recovers rested status.
 */
export function computeHealthImpact(state: GameState, rngService?: IRNGService): StateImpact {
  const injuryNews: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rng = resolveRng(rngService, state.week);

  for (const w of state.roster) {
    const updates: Partial<Warrior> = {};
    let changed = false;

    // ── Fatigue Decay (-25 per week) ──
    if (w.fatigue && w.fatigue > 0) {
      updates.fatigue = Math.max(0, w.fatigue - 25);
      changed = true;
    }

    // ── Injury Ticking ──
    const injuryObjects = (w.injuries || []).filter((i): i is InjuryData => typeof i !== 'string');
    if (injuryObjects.length > 0) {
      const result = tickInjuries(injuryObjects);
      if (result.healed.length > 0) {
        injuryNews.push(`${w.name} recovered from ${result.healed.join(', ')}.`);
      }
      updates.injuries = result.active;
      changed = true;
    }

    if (changed) {
      rosterUpdates.set(w.id, updates);
    }
  }

  return {
    rosterUpdates,
    newsletterItems:
      injuryNews.length > 0
        ? [{ id: rng.uuid(), week: state.week, title: 'Medical Report', items: injuryNews }]
        : [],
  };
}

