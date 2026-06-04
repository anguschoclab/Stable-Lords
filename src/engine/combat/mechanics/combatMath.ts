/**
 * Combat Math — RNG, phase detection, skill/contest checks.
 * Single source of truth for combat math utilities used by simulate.ts.
 */

type Phase = 'opening' | 'mid' | 'late';

const PHASE_OPENING_THRESHOLD = 0.25;
const PHASE_MID_THRESHOLD = 0.65;/**
                                  * Get phase.
                                  * @param exchange - Exchange.
                                  * @param maxExchanges - Max exchanges.
                                  * @returns The result.
                                  */


/**
 * Get phase.
 * @param exchange - Exchange.
 * @param maxExchanges - Max exchanges.
 * @returns The result.
 */
export function getPhase(exchange: number, maxExchanges: number): Phase {
  if (maxExchanges <= 0) return 'opening';
  const ratio = exchange / maxExchanges;
  if (ratio <= PHASE_OPENING_THRESHOLD) return 'opening';
  if (ratio <= PHASE_MID_THRESHOLD) return 'mid';
  return 'late';
}/**
  * Pick text.
  * @param rng - Rng.
  * @param texts - Texts.
  * @returns The result.
  */


/**
 * Pick text.
 * @param rng - Rng.
 * @param texts - Texts.
 * @returns The result.
 */
export function pickText(rng: () => number, texts: string[]): string {
  if (texts.length === 0) return '';
  const index = Math.floor(rng() * texts.length);
  return texts[index] ?? '';
}/**
  * Skill check.
  * @param rng - Rng.
  * @param skill - Skill.
  * @param modifier - Modifier.
  * @returns The result.
  */


/**
 * Skill check.
 * @param rng - Rng.
 * @param skill - Skill.
 * @param modifier - Modifier.
 * @returns The result.
 */
export function skillCheck(rng: () => number, skill: number, modifier: number = 0): boolean {
  const roll = Math.floor(rng() * 20) + 1;
  const target = Math.max(1, Math.min(19, Math.floor(skill) + modifier));
  const success = roll === 1 || (roll !== 20 && roll <= target);
  return success;
}/**
  * Contest check.
  * @param rng - Rng.
  * @param a - A.
  * @param d - D.
  * @param modA - Mod a.
  * @param modD - Mod d.
  * @returns The result.
  */


/**
 * Contest check.
 * @param rng - Rng.
 * @param a - A.
 * @param d - D.
 * @param modA - Mod a.
 * @param modD - Mod d.
 * @returns The result.
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

/**
 * Strategy map: weather type → stamina drain multiplier.
 * 1.0 = baseline. Unlisted weather types fall back to 1.0.
 */
const WEATHER_STAMINA_MOD: Record<string, number> = {
  'Blazing Sun': 1.3, // 30% more stamina drain
  'Scorching Wind': 1.3, // 30% more stamina drain
  Tornado: 1.4, // 40% more stamina drain
  'Cursed Miasma': 1.3, // 30% more stamina drain
  Sweltering: 1.2, // 20% more stamina drain
  Hailstorm: 1.2, // 20% more stamina drain
  'Blood Moon': 1.1, // 10% more stamina drain
  Gale: 1.15, // 15% more stamina drain
  'Solar Flare': 1.5, // 50% more stamina drain
  Breezy: 0.9, // 10% less stamina drain
  Eclipse: 0.8, // 20% less stamina drain, slow methodical fights
  'Blood Rain': 1.1, // 10% more stamina drain
  'Meteor Shower': 1.2, // 20% more stamina drain
  'Abyssal Gloom': 0.9, // 10% less stamina drain
  'Arcane Storm': 0.8, // 20% less stamina drain
  'Locust Swarm': 1.2, // 20% more stamina drain
  'Chaotic Winds': 1.3, // 30% more stamina drain
  // Clear / Overcast / Rainy → 1.0 (default)
};/**
   * Weather stamina modifier.
   * @param weather - Weather. (optional)
   * @returns The result.
   */


/**
 * Weather stamina modifier.
 * @param weather - Weather. (optional)
 * @returns The result.
 */
export function weatherStaminaModifier(weather?: string): number {
  if (!weather) return 1.0;
  return WEATHER_STAMINA_MOD[weather] ?? 1.0;
}
