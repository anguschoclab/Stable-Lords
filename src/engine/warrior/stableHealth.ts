/**
 * Shared weekly health tick — the single ruleset both the player roster and
 * rival stables run their passive health maintenance through (V30-W1.1).
 *
 * Ruleset (same for every stable):
 *  - fatigue decays 25/week, clamped at 0
 *  - every wounded warrior ticks injuries down 1 week (baseline recovery)
 *  - warriors on a 'recovery' assignment additionally heal (1 + healingBonus)
 *    weeks — the accelerated heal is assignment-gated for everyone; there is
 *    no free accelerated healing
 *  - inactive warriors (Dead/Retired) are skipped entirely
 */
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { tickInjuries } from '@/engine/injuries';

const FATIGUE_DECAY = 25;

export interface TickStableHealthArgs {
  warriors: Warrior[];
  /** Warrior ids on a 'recovery' assignment this week — they get the
   *  accelerated (1 + healingBonus) heal on top of the baseline tick. */
  recoveryWarriorIds?: ReadonlySet<WarriorId>;
  /** Healing-trainer bonus — extra weeks per recovery week. */
  healingBonus?: number;
}

export interface TickStableHealthResult {
  /** Updated roster — same references for warriors nothing changed on. */
  warriors: Warrior[];
  /** Warrior id → names of injuries that finished healing this week. */
  healed: Map<WarriorId, string[]>;
}

export function tickStableHealth(args: TickStableHealthArgs): TickStableHealthResult {
  const { warriors, recoveryWarriorIds, healingBonus = 0 } = args;
  const healed = new Map<WarriorId, string[]>();
  const out = warriors.map((w): Warrior => {
    if (!isActive(w)) return w;

    let next = w;
    let changed = false;

    if ((next.fatigue ?? 0) > 0) {
      next = { ...next, fatigue: Math.max(0, (next.fatigue ?? 0) - FATIGUE_DECAY) };
      changed = true;
    }

    const injuries = (next.injuries ?? []).filter(
      (i): i is InjuryData => typeof i !== 'string'
    );
    if (injuries.length > 0) {
      const healedNames: string[] = [];
      const ticked = tickInjuries(injuries);
      healedNames.push(...ticked.healed);
      let active = ticked.active;

      // Recovery assignment: accelerated heal on top of the baseline week.
      if (recoveryWarriorIds?.has(w.id)) {
        const healAmount = 1 + healingBonus;
        const stillActive: InjuryData[] = [];
        for (const inj of active) {
          const remaining = inj.weeksRemaining - healAmount;
          if (remaining <= 0) healedNames.push(inj.name);
          else stillActive.push({ ...inj, weeksRemaining: remaining });
        }
        active = stillActive;
      }

      next = { ...next, injuries: active };
      changed = true;
      if (healedNames.length > 0) healed.set(w.id, healedNames);
    }

    return changed ? next : w;
  });
  return { warriors: out, healed };
}
