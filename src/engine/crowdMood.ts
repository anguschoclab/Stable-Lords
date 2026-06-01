/**
 * Stable Lords — Crowd Mood System
 * Arena-wide mood states that affect fame gain, kill probability, and gazette tone.
 */
import type { FightSummary } from '@/types/combat.types';/**
                                                          * Crowd mood type.
                                                          */


/**
 * Crowd mood type.
 */
export type CrowdMood = 'Calm' | 'Bloodthirsty' | 'Theatrical' | 'Solemn' | 'Festive';/**
                                                                                       * Crowd_moods.
                                                                                       */


/**
 * Crowd_moods.
 */
export const CROWD_MOODS: CrowdMood[] = ['Calm', 'Bloodthirsty', 'Theatrical', 'Solemn', 'Festive'];/**
                                                                                                     * Mood_descriptions.
                                                                                                     */


/**
 * Mood_descriptions.
 */
export const MOOD_DESCRIPTIONS: Record<CrowdMood, string> = {
  Calm: 'The crowd watches with quiet anticipation.',
  Bloodthirsty: 'The mob roars for blood! Kill probability increased.',
  Theatrical: 'The audience craves spectacle. Flashy fighters gain extra popularity.',
  Solemn: 'A somber mood lingers after recent deaths. Fame gains are muted.',
  Festive: 'Festival atmosphere! Fame and popularity gains are boosted.',
};/**
   * Mood_icons.
   */


/**
 * Mood_icons.
 */
export const MOOD_ICONS: Record<CrowdMood, string> = {
  Calm: '😐',
  Bloodthirsty: '🩸',
  Theatrical: '🎭',
  Solemn: '🕯️',
  Festive: '🎉',
};/**
   * Defines the shape of mood modifiers.
   */


/**
 * Defines the shape of mood modifiers.
 */
export interface MoodModifiers {
  fameMultiplier: number;
  popMultiplier: number;
  killChanceBonus: number;
}/**
  * Get mood modifiers.
  * @param mood - Mood.
  * @returns The result.
  */


/**
 * Get mood modifiers.
 * @param mood - Mood.
 * @returns The result.
 */
export function getMoodModifiers(mood: CrowdMood): MoodModifiers {
  switch (mood) {
    case 'Bloodthirsty':
      return { fameMultiplier: 1.0, popMultiplier: 0.8, killChanceBonus: 0.1 };
    case 'Theatrical':
      return { fameMultiplier: 1.0, popMultiplier: 1.5, killChanceBonus: 0 };
    case 'Solemn':
      return { fameMultiplier: 0.7, popMultiplier: 0.7, killChanceBonus: -0.05 };
    case 'Festive':
      return { fameMultiplier: 1.3, popMultiplier: 1.3, killChanceBonus: 0 };
    default:
      return { fameMultiplier: 1.0, popMultiplier: 1.0, killChanceBonus: 0 };
  }
}

/**
 * Determine next crowd mood based on recent fight history.
 */
export function computeCrowdMood(recentFights: FightSummary[]): CrowdMood {
  if (recentFights.length === 0) return 'Calm';

  const last5 = recentFights.slice(-5);
  const { kills, flashy, draws } = last5.reduce(
    (acc, f) => {
      if (f.by === 'Kill') acc.kills++;
      if (f.flashyTags?.includes('Flashy')) acc.flashy++;
      if (f.winner === null) acc.draws++;
      return acc;
    },
    { kills: 0, flashy: 0, draws: 0 }
  );

  if (kills >= 2) return 'Bloodthirsty';
  if (kills >= 1 && draws >= 2) return 'Solemn';
  if (flashy >= 3) return 'Theatrical';
  if (last5.length >= 4 && kills === 0) return 'Festive';
  return 'Calm';
}
