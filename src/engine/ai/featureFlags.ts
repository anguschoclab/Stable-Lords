/**
 * AI feature flags (Phase-3 plan §8, V10 `__AI_DEBUG` precedent):
 * `globalThis` toggles for soak bisection and controlled rollout.
 *
 * Unset means enabled — the flags preserve shipped behavior; setting a flag
 * to `false` makes the feature inert, which is exactly what a bisection
 * needs ("does the drift vanish with AI_DECOY off?"). Soak harnesses set
 * these before the run starts; combat and weekly code read them per call —
 * a property read on globalThis, cheap enough for hot loops.
 */
export type AiFeatureFlag = 'AI_COMPETENCE' | 'AI_SEASON_PLANS' | 'AI_READS' | 'AI_DECOY';

/** Returns false only when the flag is explicitly set to `false`. */
export function aiFeature(flag: AiFeatureFlag): boolean {
  return (globalThis as Record<string, unknown>)[flag] !== false;
}
