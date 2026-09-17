/**
 * Shared fighting-style groupings for weapon suitability data.
 *
 * Deduplicates the verbatim-repeated preferredStyles / restrictedStyles arrays in
 * weapons.ts. Constants here are shared references across multiple weapons — do
 * NOT mutate them (use `without()` or spread into a new array if you need a local
 * variant). Not re-exported from the equipment index; internal to the equipment
 * data layer.
 */
import { FightingStyle } from '@/types/game';

const S = FightingStyle;

/**
 * All 10 fighting styles in canonical (enum-declaration) order. Kept as a literal
 * (not Object.values) so a new style never silently leaks into without()-derived
 * lists. The existing "rates every weapon for all 10 styles" test (which iterates
 * Object.values(FightingStyle)) will fail loudly if the enum grows, forcing a
 * deliberate review.
 */
export const ALL_STYLES: FightingStyle[] = [
  S.AimedBlow,
  S.BashingAttack,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.ParryStrike,
  S.SlashingAttack,
  S.StrikingAttack,
  S.TotalParry,
  S.WallOfSteel,
];

/**
 * All styles except the given ones — for "all except X" suitability lists.
 * Returns a new array each call; does not mutate ALL_STYLES.
 */
export function without(...excluded: FightingStyle[]): FightingStyle[] {
  const ex = new Set(excluded);
  return ALL_STYLES.filter((style) => !ex.has(style));
}

// ── Repeated preferredStyles groupings (verbatim 2+ times in weapons.ts) ─────

/** Nimble fencing swords (épée, shortsword, longsword): all except bashing & wall-of-steel. */
export const FENCING_PREFERRED_STYLES: FightingStyle[] = without(
  S.BashingAttack,
  S.WallOfSteel
);

/** Heavy crushing weapons (mace, halberd, maul): only bashing & striking. */
export const BASHING_STRIKE_STYLES: FightingStyle[] = [S.BashingAttack, S.StrikingAttack];

/** Spiked/chained crushing weapons (morning star, war flail): bashing, striking & wall-of-steel. */
export const CRUSHING_PREFERRED_STYLES: FightingStyle[] = [
  S.BashingAttack,
  S.StrikingAttack,
  S.WallOfSteel,
];

// ── Repeated restrictedStyles groupings (verbatim 2+ times in weapons.ts) ─────

/** Fencing swords (épée, shortsword, longsword) forbid bashing & wall-of-steel. */
export const FENCING_RESTRICTED_STYLES: FightingStyle[] = [S.BashingAttack, S.WallOfSteel];

/** Spears (short & long) forbid bashing, slashing & wall-of-steel. */
export const SPEAR_RESTRICTED_STYLES: FightingStyle[] = [
  S.BashingAttack,
  S.SlashingAttack,
  S.WallOfSteel,
];

/** Heavy two-handed blades (greatsword, battle axe) forbid the finesse/lunge quartet. */
export const HEAVY_RESTRICTED_STYLES: FightingStyle[] = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
];

/** Crushing weapons (morning star, war flail) forbid finesse/lunge + total-parry. */
export const CRUSHING_RESTRICTED_STYLES: FightingStyle[] = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.SlashingAttack,
  S.TotalParry,
];

/** Bashing weapons (mace, war hammer) forbid finesse/lunge + wall-of-steel. */
export const BASHING_RESTRICTED_STYLES: FightingStyle[] = [
  S.AimedBlow,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.SlashingAttack,
  S.WallOfSteel,
];
