/**
 * Gazette Template Helpers - Template substitution and helper functions
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';
import type { CrowdMoodType } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNG } from '@/utils/random';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { escapeHtml } from '@/utils/escapeHtml';

/**
 * Mood_tone.
 */
const MOOD_TONE: Record<
  CrowdMoodType,
  { adjectives: string[]; opener: string[]; closer: string[] }
> = (narrativeContent as NarrativeContent).ux_metadata.mood_tone;

export { MOOD_TONE };

/**
 * Defined default used whenever a mood has no tone record.
 */
export const DEFAULT_CROWD_MOOD: CrowdMoodType = 'Calm';

/**
 * Normalizes any value to a valid CrowdMoodType, falling back to the default.
 */
export function resolveCrowdMood(mood: string): CrowdMoodType {
  return Object.prototype.hasOwnProperty.call(MOOD_TONE, mood)
    ? (mood as CrowdMoodType)
    : DEFAULT_CROWD_MOOD;
}

/**
 * Returns the mood-tone record for a mood, falling back to the default's record.
 */
export function resolveMoodTone(mood: string) {
  return MOOD_TONE[resolveCrowdMood(mood)];
}

/**
 * Template data type for substitution.
 */
type TemplateData = Record<string, string | number | boolean | undefined>;

/**
 * Gets display name for a fighting style.
 */
export function styleName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style;
}

/**
 * Template substitution function.
 * Replaces {{key}} placeholders in templates with data values.
 */
export function t(template: string | string[], data: TemplateData, rng?: IRNGService): string {
  const result = Array.isArray(template)
    ? rng
      ? rng.pick(template)
      : template[
          Math.floor(new SeededRNG(cryptoRandomInt(0, 2147483647)).next() * template.length)
        ] || ''
    : template;

  if (!result || typeof result !== 'string' || !result.includes('{{')) return result || '';

  return result.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const val = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
    return val !== undefined ? escapeHtml(String(val)) : match;
  });
}
