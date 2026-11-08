/**
 * Trains-burn-skills economy (Arena 93 canon, V23 pull-in of V22-deferred D2).
 *
 * Canon: raising an attribute that crosses a skill breakpoint consumes
 * future skill-learning capacity — the warrior spent the growth on stats
 * instead of lessons. ST raises landing ≤14 and all CN raises are free
 * because the ST/CN tables cross no breakpoints in that range.
 *
 * Implemented as a generic breakpoint-delta rule: for each +1 gain,
 * count `bp(table, new) − bp(table, old)` per skill table the attribute
 * feeds; that many learn slots burn. The ST 7–14 / CN freedom falls out
 * of the tables automatically — no special casing.
 */
import type { Attributes, BaseSkills } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { LEARN_PER_SKILL_CAP } from '@/constants/combat/combat/learn';

/**
 * Compute the per-skill burn caused by one +1 attribute gain.
 *
 * @param attr - Attribute being raised.
 * @param oldVal - Attribute value before the gain.
 * @param newVal - Attribute value after the gain (oldVal + 1).
 * @returns Partial skill → slots-burned map. {} when the gain crosses no
 *   breakpoint (free train).
 */
export function breakpointBurns(
  attr: keyof Attributes,
  oldVal: number,
  newVal: number
): Partial<Record<keyof BaseSkills, number>> {
  void attr;
  void oldVal;
  void newVal;
  return {};
}

/**
 * Merge new burns into a warrior's burnedSkills ledger.
 */
export function applySkillBurns(
  warrior: Warrior,
  burns: Partial<Record<keyof BaseSkills, number>>
): Warrior {
  if (Object.keys(burns).length === 0) return warrior;
  const burnedSkills = { ...(warrior.burnedSkills ?? {}) };
  for (const [skill, n] of Object.entries(burns)) {
    const k = skill as keyof BaseSkills;
    burnedSkills[k] = (burnedSkills[k] ?? 0) + (n ?? 0);
  }
  return { ...warrior, burnedSkills };
}

/**
 * Effective per-skill learn cap for a warrior — LEARN_PER_SKILL_CAP minus
 * the burned slots. A fully-burned skill can never be learned.
 */
export function effectiveLearnCap(
  warrior: Pick<Warrior, 'burnedSkills'>,
  skill: keyof BaseSkills
): number {
  return Math.max(0, LEARN_PER_SKILL_CAP - (warrior.burnedSkills?.[skill] ?? 0));
}
