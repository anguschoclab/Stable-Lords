/**
 * Stable Lords — Base Skills & Derived Stats Calculator
 * Based on Duelmasters canonical formulas (pid=2, 8-16, Terrablood references)
 *
 * Base Skills: ATT, PAR, DEF, INI, RIP, DEC
 * Derived: HP, Endurance, Damage, Encumbrance
 */
import { FightingStyle, type Attributes, type BaseSkills, type DerivedStats } from "@/types/game";

// ─── Style Seed Offsets (canonical approximations from Terrablood) ────────
// Each style has base offsets for [ATT, PAR, DEF, INI, RIP, DEC]
const STYLE_SEEDS: Record<FightingStyle, [number, number, number, number, number, number]> = {
  //                                          ATT PAR DEF INI RIP DEC
  // BALANCE v3: PAR compressed to 3-4 range (was 2-5). Only 1 point separates
  // best/worst parry so raw PAR no longer dominates. Style identity comes from
  // ATT, RIP, INI, DEC, endurance, and passives instead.
  [FightingStyle.AimedBlow]:       [ 5,  3,  3,  3,  2,  4],  // 20 — precision via crit
  [FightingStyle.BashingAttack]:   [ 6,  3,  2,  4,  2,  3],  // 20 — ATT+INI offense
  [FightingStyle.LungingAttack]:   [ 6,  3,  3,  5,  2,  3],  // 22 — fast, aggressive
  [FightingStyle.ParryLunge]:      [ 4,  4,  3,  3,  3,  3],  // 20 — balanced hybrid
  [FightingStyle.ParryRiposte]:    [ 3,  4,  3,  3,  4,  2],  // 19 — RIP identity (reduced from 5)
  [FightingStyle.ParryStrike]:     [ 4,  4,  3,  3,  3,  3],  // 20 — efficient, consistent
  [FightingStyle.SlashingAttack]:  [ 6,  3,  2,  4,  2,  3],  // 20 — offensive, reduced DEF
  [FightingStyle.StrikingAttack]:  [ 6,  3,  2,  4,  2,  3],  // 20 — reliable power
  [FightingStyle.TotalParry]:      [ 2,  4,  4,  2,  3,  2],  // 17 — defensive but low ATT
  [FightingStyle.WallOfSteel]:     [ 3,  3,  4,  3,  3,  3],  // 19 — DEF+endurance identity
};

// ─── Attribute → Skill Breakpoint Contributions ──────────────────────────
// Simplified from Terrablood breakpoint tables

function breakpointBonus(val: number): number {
  if (val >= 21) return 4;
  if (val >= 17) return 3;
  if (val >= 13) return 2;
  if (val >= 9) return 1;
  return 0;
}

/**
 * Compute base skills from attributes + fighting style.
 * Deterministic — no randomness.
 */
export function computeBaseSkills(attrs: Attributes, style: FightingStyle): BaseSkills {
  const seed = STYLE_SEEDS[style];
  const { ST, CN, SZ, WT, WL, SP, DF } = attrs;

  // ATT: WT primary, DF secondary, ST tertiary
  const ATT = seed[0] + breakpointBonus(WT) * 2 + breakpointBonus(DF) + breakpointBonus(ST);

  // PAR: WT primary, DF secondary, WL tertiary
  const PAR = seed[1] + breakpointBonus(WT) * 2 + breakpointBonus(DF) + breakpointBonus(WL);

  // DEF: SP primary, DF secondary, WT tertiary
  const DEF = seed[2] + breakpointBonus(SP) * 2 + breakpointBonus(DF) + breakpointBonus(WT);

  // INI: SP primary, WT secondary, DF tertiary
  const INI = seed[3] + breakpointBonus(SP) * 2 + breakpointBonus(WT) + breakpointBonus(DF);

  // RIP: DF primary, WT secondary, SP tertiary
  const RIP = seed[4] + breakpointBonus(DF) * 2 + breakpointBonus(WT) + breakpointBonus(SP);

  // DEC: WT primary, WL secondary
  const DEC = seed[5] + breakpointBonus(WT) * 2 + breakpointBonus(WL);

  return {
    ATT: Math.max(1, Math.min(20, ATT)),
    PAR: Math.max(1, Math.min(20, PAR)),
    DEF: Math.max(1, Math.min(20, DEF)),
    INI: Math.max(1, Math.min(20, INI)),
    RIP: Math.max(1, Math.min(20, RIP)),
    DEC: Math.max(1, Math.min(20, DEC)),
  };
}

// ─── Derived Stats ───────────────────────────────────────────────────────

/** HP = f(CN, SZ, WL) per pid=39 */
export function computeHP(attrs: Attributes): number {
  const { CN, SZ, WL } = attrs;
  // Base HP from CN, modified by SZ and WL
  return Math.max(10, Math.round(CN * 1.5 + SZ * 0.5 + WL * 0.3 + 5));
}

/** Endurance = f(CN, WL, ST) per pid=40 — BALANCE v2: increased base for longer fights */
export function computeEndurance(attrs: Attributes): number {
  const { CN, WL, ST } = attrs;
  return Math.max(10, Math.round(CN * 1.2 + WL * 1.5 + ST * 0.5 + 8));
}

/** Damage class = f(ST, SZ) per pid=41 — returns 1-5 scale */
export function computeDamage(attrs: Attributes): number {
  const { ST, SZ } = attrs;
  const raw = ST + Math.floor(SZ / 2);
  if (raw >= 30) return 5; // Tremendous
  if (raw >= 24) return 4; // Great
  if (raw >= 18) return 3; // Good
  if (raw >= 12) return 2; // Normal
  return 1; // Little
}

export const DAMAGE_LABELS = ["", "Little", "Normal", "Good", "Great", "Tremendous"];

/** Encumbrance capacity = f(ST, CN, SZ) per pid=42-45 */
export function computeEncumbrance(attrs: Attributes): number {
  const { ST, CN, SZ } = attrs;
  // Higher = can carry more. Scale 1-10.
  const raw = Math.round(ST * 0.8 + CN * 0.4 - SZ * 0.2 + 5);
  return Math.max(1, Math.min(10, raw));
}

/** Convenience: compute all derived stats */
export function computeDerivedStats(attrs: Attributes): DerivedStats {
  return {
    hp: computeHP(attrs),
    endurance: computeEndurance(attrs),
    damage: computeDamage(attrs),
    encumbrance: computeEncumbrance(attrs),
  };
}

/** Full computation: base skills + derived stats */
export function computeWarriorStats(attrs: Attributes, style: FightingStyle) {
  return {
    baseSkills: computeBaseSkills(attrs, style),
    derivedStats: computeDerivedStats(attrs),
  };
}
