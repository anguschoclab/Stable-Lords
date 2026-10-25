/**
 * Death rolls — canonical Duel2 two-roll model (Noblish Island, "Mechanics
 * of Death"). Pure probability functions: callers draw `rng() < chance`.
 *
 *   vital hit → vitals roll (calculateKillWindow) → DEATH_INTENT statement
 *   → death roll → fail = doomed → non-critical vital hits until hp is gone.
 *
 * A warrior at ≤0 hp without a death intent instead makes the infirmary
 * roll; failing it sends them to the same death roll — "died of wounds".
 */
import { DEATH_ROLL, INFIRMARY } from '@/constants/combat';
import { clamp } from '@/utils/math';
import type { HitLocation } from './hitLocation';

const NO_ARMOR_ID = 'none_armor';
const NO_HELM_ID = 'none_helm';
const BASELINE_WILL = 10;
const BASELINE_MAX_HP = 60;

/** What the struck warrior brings to the death roll — canon survival factors. */
interface DeathRollArgs {
  /** Location of the blow that opened the death intent. */
  hitLoc: HitLocation;
  armorId?: string;
  helmId?: string;
  /** Defender WL — "the stat that is checked when your warrior enters the
   *  infirmary" (Staying Alive). */
  will: number;
  /** Defender maxHp — smaller warriors die more often. */
  maxHp: number;
  /** Career bouts — young fighters die much more than veterans. */
  totalFights: number;
  /** Current endurance fraction — exhausted warriors die more. */
  enduranceRatio: number;
}

/**
 * Probability the struck warrior fails the death roll and is doomed.
 * Defender-side factors live here — Staying Alive: armor (any >> none,
 * helm vs head), will, hit points, youth, exhaustion.
 */
export function deathRollFailChance(args: DeathRollArgs): number {
  const { hitLoc, armorId, helmId, will, maxHp, totalFights, enduranceRatio } = args;
  const K = DEATH_ROLL;

  let p = K.BASE_FAIL;
  if (!armorId || armorId === NO_ARMOR_ID) p += K.NO_ARMOR_ADD;
  if (hitLoc === 'head' && (!helmId || helmId === NO_HELM_ID)) p += K.NO_HELM_HEAD_ADD;
  p += (will - BASELINE_WILL) * K.WL_COEFF;
  p += ((maxHp - BASELINE_MAX_HP) / 10) * K.HP_POOL_COEFF;
  p += Math.max(0, K.YOUTH_FIGHTS_REF - totalFights) * K.YOUTH_COEFF;
  if (enduranceRatio <= 0) p += K.EXHAUSTED_ADD;

  return clamp(p, 0, 1);
}

/** What the downed warrior brings to the infirmary roll. */
interface InfirmaryRollArgs {
  will: number;
  enduranceRatio: number;
}

/**
 * Probability the infirmary roll fails, sending the downed warrior to the
 * death roll. Minority path — canon says ~90% of deaths come via the
 * death-intent statement.
 */
export function infirmaryFailChance(args: InfirmaryRollArgs): number {
  const { will, enduranceRatio } = args;
  const K = INFIRMARY;

  let p = K.BASE_FAIL;
  if (enduranceRatio <= 0) p += K.EXHAUSTED_ADD;
  p += (will - BASELINE_WILL) * K.WL_COEFF;

  return clamp(p, 0, 1);
}

/** Minimal fighter view needed by the hp-depletion death path. */
interface DownedFighterView {
  attributes: { WL: number };
  maxHp: number;
  endurance: number;
  maxEndurance: number;
  totalFights: number;
  armorId?: string;
  helmId?: string;
}

/**
 * Combined infirmary → death roll for hp-depletion deaths (bleed, hazards,
 * ripostes, stoppage damage — canon: "does not matter where your warrior
 * gets hit"). `deathMult` is the house-rule multiplier (0 = no death).
 */
export function rollInfirmaryOutcome(
  rng: () => number,
  f: DownedFighterView,
  deathMult: number
): boolean {
  const enduranceRatio = f.endurance / f.maxEndurance;
  return (
    rng() < infirmaryFailChance({ will: f.attributes.WL, enduranceRatio }) * deathMult &&
    rng() <
      deathRollFailChance({
        hitLoc: 'chest',
        armorId: f.armorId,
        helmId: f.helmId,
        will: f.attributes.WL,
        maxHp: f.maxHp,
        totalFights: f.totalFights,
        enduranceRatio,
      }) * deathMult
  );
}
