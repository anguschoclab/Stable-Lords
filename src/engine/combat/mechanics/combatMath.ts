import { clamp } from '@/utils/math';
/**
 * Combat Math — RNG, skill/contest checks.
 * Phase detection has moved to @/engine/combat/phase.ts (canonical module).
 */

/**
 * Pick text.
 */
export function pickText(rng: () => number, texts: string[]): string {
  if (texts.length === 0) return '';
  const index = Math.floor(rng() * texts.length);
  return texts[index] ?? '';
} /**
 * Skill check.
 */

/**
 * Skill check.
 */
export function skillCheck(rng: () => number, skill: number, modifier: number = 0): boolean {
  const roll = Math.floor(rng() * 20) + 1;
  const target = clamp(Math.floor(skill) + modifier, 1, 19);
  const success = roll === 1 || (roll !== 20 && roll <= target);
  return success;
} /**
 * Contest check.
 */

/**
 * Contest check.
 */
export function contestCheck(
  rng: () => number,
  a: number,
  d: number,
  modA: number = 0,
  modD: number = 0
): boolean {
  const rollA = Math.floor(rng() * 20) + 1 + a + modA;
  const rollD = Math.floor(rng() * 20) + 1 + d + modD;
  return rollA > rollD;
}
