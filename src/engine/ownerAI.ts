import { FightingStyle } from "@/types/game";
import type { Warrior, FightPlan, OwnerPersonality } from "@/types/game";
import { defaultPlanForWarrior } from "./simulate";
import { PERSONALITY_PLAN_MODS, PHILOSOPHY_PLAN_MODS } from "@/data/ownerData";

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics from the Fighting Styles Compendium.
 */
export function aiPlanForWarrior(
  w: Warrior,
  personality: OwnerPersonality,
  philosophy: string,
  opponentStyle?: FightingStyle
): FightPlan {
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};

  // Per-style matchup heuristics
  const matchup = opponentStyle ? getStyleMatchupMods(w.style, opponentStyle) : { oe: 0, al: 0, kd: 0 };

  return {
    ...base,
    OE: clamp((base.OE ?? 5) + (pMod.OE ?? 0) + (phMod.OE ?? 0) + matchup.oe, 1, 10),
    AL: clamp((base.AL ?? 5) + (pMod.AL ?? 0) + (phMod.AL ?? 0) + matchup.al, 1, 10),
    killDesire: clamp((base.killDesire ?? 5) + (pMod.killDesire ?? 0) + (phMod.killDesire ?? 0) + matchup.kd, 1, 10),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Per-style matchup heuristics from the Fighting Styles Compendium.
 * Returns OE/AL/KD adjustments when facing a specific opponent style.
 */
export function getStyleMatchupMods(
  myStyle: FightingStyle,
  oppStyle: FightingStyle
): { oe: number; al: number; kd: number } {
  // Map myStyle to its counter logic
  const matchers: Partial<Record<FightingStyle, (opp: FightingStyle) => { oe: number; al: number; kd: number } | null>> = {
    [FightingStyle.AimedBlow]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte) return { oe: 1, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.BashingAttack]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel) return { oe: 2, al: 1, kd: 1 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.LungingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: -1, al: 2, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte) return { oe: -2, al: 1, kd: -1 };
      return null;
    },
    [FightingStyle.ParryLunge]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.ParryRiposte]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack) return { oe: -2, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.ParryStrike]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: 1, al: 0, kd: 1 };
      if (opp === FightingStyle.LungingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.StrikingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      if (opp === FightingStyle.WallOfSteel) return { oe: 2, al: 0, kd: 1 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.SlashingAttack]: (opp) => {
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte) return { oe: 1, al: 0, kd: 0 };
      if (opp === FightingStyle.ParryStrike) return { oe: 0, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.TotalParry]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel) return { oe: -2, al: -1, kd: -1 };
      if (opp === FightingStyle.AimedBlow) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.WallOfSteel]: (opp) => {
      if (opp === FightingStyle.StrikingAttack) return { oe: 0, al: 1, kd: 0 };
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
  };

  const matcher = matchers[myStyle];
  return matcher?.(oppStyle) ?? { oe: 0, al: 0, kd: 0 };
}
