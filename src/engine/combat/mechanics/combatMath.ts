/**
 * Combat Math — RNG, phase detection, skill/contest checks.
 * Single source of truth for combat math utilities used by simulate.ts.
 */

type Phase = 'opening' | 'mid' | 'late';

const PHASE_OPENING_THRESHOLD = 0.25;
const PHASE_MID_THRESHOLD = 0.65;

export function getPhase(exchange: number, maxExchanges: number): Phase {
  if (maxExchanges <= 0) return 'opening';
  const ratio = exchange / maxExchanges;
  if (ratio <= PHASE_OPENING_THRESHOLD) return 'opening';
  if (ratio <= PHASE_MID_THRESHOLD) return 'mid';
  return 'late';
}

export function pickText(rng: () => number, texts: string[]): string {
  if (texts.length === 0) return '';
  const index = Math.floor(rng() * texts.length);
  return texts[index] ?? '';
}

export function skillCheck(rng: () => number, skill: number, modifier: number = 0): boolean {
  const roll = Math.floor(rng() * 20) + 1;
  const target = Math.max(1, Math.min(19, Math.floor(skill) + modifier));
  const success = roll === 1 || (roll !== 20 && roll <= target);
  return success;
}

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
  Sweltering: 1.2, // 20% more stamina drain
  'Blood Moon': 1.1, // 10% more stamina drain
  Gale: 1.15, // 15% more stamina drain
  Breezy: 0.9, // 10% less stamina drain
  Eclipse: 0.8, // 20% less stamina drain, slow methodical fights
  // Clear / Overcast / Rainy → 1.0 (default)
};

export function weatherStaminaModifier(weather?: string): number {
  if (!weather) return 1.0;
  return WEATHER_STAMINA_MOD[weather] ?? 1.0;
}
