import type { Trainer, TrainerSpecialty } from '@/types/shared.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/resolution';
import { TIER_BONUS } from '@/engine/trainers';

/**
 * Specialty modifiers that stack on top of the base getTrainingBonus() values.
 * All are additive and default to no-ops (0 / 1.0 multipliers).
 */
export interface SpecialtyMods {
  attMod: number;
  defMod: number;
  parMod: number;
  iniMod: number;
  decMod: number;
  endMod: number;
  killWindowBonus: number; // added to kill threshold probability
  damageReceivedMult: number; // multiplier on incoming damage (< 1.0 = reduction)
  riposteDamageMult: number; // multiplier on outgoing riposte damage
  fatiguePenaltyReduction: number; // fraction to reduce the fatigue skill penalty (0 = no change)
}

export function defaultSpecialtyMods(): SpecialtyMods {
  return {
    attMod: 0,
    defMod: 0,
    parMod: 0,
    iniMod: 0,
    decMod: 0,
    endMod: 0,
    killWindowBonus: 0,
    damageReceivedMult: 1.0,
    riposteDamageMult: 1.0,
    fatiguePenaltyReduction: 0,
  };
}

/** Function type for a per-specialty mod applicator. */
type SpecialtyHandlerFn = (
  mods: SpecialtyMods,
  self: FighterState,
  opponent: FighterState,
  ctx: ResolutionContext,
  tier: number
) => void;

/**
 * Strategy map: each TrainerSpecialty maps to a function that mutates
 * the SpecialtyMods object in place.
 * TypeScript will error if a TrainerSpecialty variant is added without a handler.
 */
const SPECIALTY_HANDLERS: Record<TrainerSpecialty, SpecialtyHandlerFn> = {
  KillerInstinct: (mods, _self, opponent, _ctx, tier) => {
    // Kill-window bonus when enemy HP < 40%.
    // Halved 2026-04 to stay proportional to the new 0.025 cap on
    // calculateKillWindow — at the prior 0.02*tier (up to +0.06 at Master)
    // a single trainer would saturate the cap on its own.
    if (opponent.hp / opponent.maxHp < 0.4) {
      mods.killWindowBonus += 0.01 * tier;
    }
  },
  IronConditioning: (mods, _self, _opponent, ctx, tier) => {
    // Stamina drain reduced in LATE phase — applied via endMod bonus
    if (ctx.phase === 'LATE') {
      mods.endMod += 0.1 * tier;
    }
  },
  CounterFighter: (mods, _self, _opponent, _ctx, tier) => {
    // Riposte damage amplified (conditional: always active once trained)
    mods.riposteDamageMult += 0.15 * tier;
  },
  Footwork: (mods, _self, _opponent, ctx, tier) => {
    // Initiative bonus in MID/LATE phase
    if (ctx.phase !== 'OPENING') {
      mods.iniMod += 3 * tier;
    }
  },
  IronGuard: (mods, self, _opponent, _ctx, tier) => {
    // Damage reduction while endurance is above 60%
    if (self.endurance / self.maxEndurance > 0.6) {
      mods.damageReceivedMult *= 1 - 0.1 * tier;
    }
  },
  Finisher: (mods, self, _opponent, _ctx, tier) => {
    // ATT bonus when fighter has momentum advantage
    if (self.momentum >= 2) {
      mods.attMod += 0.1 * tier;
    }
  },
  RopeADope: (mods, _self, _opponent, _ctx, tier) => {
    // Reduce fatigue penalty (caps at 50% reduction)
    mods.fatiguePenaltyReduction = Math.min(0.5, mods.fatiguePenaltyReduction + 0.3 * tier);
  },
};

/**
 * Returns the additive specialty mods for a fighter given current fight state.
 * Called once per exchange from getTrainerMods() in simulateHelpers.ts.
 * The existing getTrainingBonus() and computeTrainerBonus() are NOT modified.
 */
export function getSpecialtyMods(
  trainers: Trainer[] | undefined,
  self: FighterState,
  opponent: FighterState,
  ctx: ResolutionContext
): SpecialtyMods {
  const mods = defaultSpecialtyMods();
  if (!trainers) return mods;

  const hasKillerInstinct = trainers.some(
    (t) => t.contractWeeksLeft > 0 && t.specialty === 'KillerInstinct'
  );
  const hasFinisher = trainers.some((t) => t.contractWeeksLeft > 0 && t.specialty === 'Finisher');

  for (const trainer of trainers) {
    if (trainer.contractWeeksLeft <= 0 || !trainer.specialty) continue;
    const tier = TIER_BONUS[trainer.tier] ?? 1;
    const handler = SPECIALTY_HANDLERS[trainer.specialty];
    if (handler) handler(mods, self, opponent, ctx, tier);
  }

  // Chemistry combo: KillerInstinct + Finisher together → extra kill window bonus.
  // Halved 2026-04 to match the new kill-window cap of 0.025.
  if (
    hasKillerInstinct &&
    hasFinisher &&
    opponent.hp / opponent.maxHp < 0.4 &&
    self.momentum >= 2
  ) {
    mods.killWindowBonus += 0.005;
  }

  mods.damageReceivedMult = Math.max(0.5, mods.damageReceivedMult); // floor at 50% reduction
  return mods;
}
