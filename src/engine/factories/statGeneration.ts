import {
  FightingStyle,
  type Attributes,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
} from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';

type Archetype = 'brutal' | 'agile' | 'cunning' | 'tank';

/**
 * Style_archetype.
 */
export const STYLE_ARCHETYPE: Record<FightingStyle, Archetype> = {
  [FightingStyle.BashingAttack]: 'brutal',
  [FightingStyle.StrikingAttack]: 'brutal',
  [FightingStyle.LungingAttack]: 'agile',
  [FightingStyle.SlashingAttack]: 'agile',
  [FightingStyle.AimedBlow]: 'cunning',
  [FightingStyle.ParryRiposte]: 'cunning',
  [FightingStyle.ParryLunge]: 'cunning',
  [FightingStyle.ParryStrike]: 'cunning',
  [FightingStyle.TotalParry]: 'tank',
  [FightingStyle.WallOfSteel]: 'tank',
};

const PERTURBATIONS = 3;
const TOTAL_MIN = 68;
const TOTAL_MAX = 74;

/**
 * Generates attributes from the style's canonical Arena-93 fighter concepts:
 * picks one concept spread (scaled to the 70-point budget), then applies up
 * to three ±1 perturbations to keep recruits varied while staying inside
 * the 68–74 total band and the attribute clamps. Returns a fresh object —
 * callers mutate the result (trait bonuses, apprentice schooling).
 */
export function generateArchetypeAttrs(style: FightingStyle, rng: IRNGService): Attributes {
  const concepts = FIGHTER_CONCEPTS[style].concepts;
  const base = rng.pick(concepts);
  const attrs: Attributes = { ...base.stats };
  let total = ATTRIBUTE_KEYS.reduce((s, k) => s + attrs[k], 0);

  for (let i = 0; i < PERTURBATIONS; i++) {
    const key = rng.pick(ATTRIBUTE_KEYS);
    const delta = rng.next() < 0.5 ? -1 : 1;
    const next = attrs[key] + delta;
    const nextTotal = total + delta;
    if (
      next >= ATTRIBUTE_MIN &&
      next <= ATTRIBUTE_MAX &&
      nextTotal >= TOTAL_MIN &&
      nextTotal <= TOTAL_MAX
    ) {
      attrs[key] = next;
      total = nextTotal;
    }
  }

  return attrs;
}
