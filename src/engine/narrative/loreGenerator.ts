/**
 * Warrior Lore Generation — combines data pools into formatted lore strings.
 *
 * Data arrays (ORIGINS, CHILDHOOD_TRAITS, DEFINING_MOMENTS) extracted to
 * `lore/loreData.ts` for SRP separation of data from logic.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { ORIGINS, CHILDHOOD_TRAITS, DEFINING_MOMENTS } from './lore/loreData';

/**
 * Generate warrior lore by combining a childhood trait and defining moment.
 * @param name - The warrior's name.
 * @param rng - RNG service for random selection.
 * @returns A formatted lore string.
 */
export function generateLore(name: string, rng: IRNGService): string {
  const childhood = rng.pick(CHILDHOOD_TRAITS);
  const defining = rng.pick(DEFINING_MOMENTS);
  return `${name} ${childhood}, ${defining}.`;
}

/**
 * Generate a warrior's origin story.
 * @param rng - RNG service for random selection.
 * @returns An origin string from the ORIGINS pool.
 */
export function generateOrigin(rng: IRNGService): string {
  return rng.pick(ORIGINS);
}
