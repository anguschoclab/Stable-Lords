import type { CrowdMood } from '@/engine/bout/crowdMood';

/** Weeks of recorded temperament shown in the ledger strip. */
export const MOOD_TRAIL_LIMIT = 20;
/** Below this many recorded weeks the strip shows its forming cue instead. */
export const MOOD_TRAIL_MIN = 2;

/** Mood → semantic cell color. Tokens only — matches arena viz vocabulary. */
export const MOOD_CELL_CLASS: Record<CrowdMood, string> = {
  Calm: 'bg-arena-bone/40',
  Bloodthirsty: 'bg-arena-blood shadow-[0_0_6px_hsl(var(--arena-blood)/0.5)]',
  Theatrical: 'bg-arena-fame',
  Solemn: 'bg-arena-steel/70',
  Festive: 'bg-arena-gold',
};

/**
 * Tail of `state.moodHistory` for the ledger strip — oldest → newest, one
 * cell per week. `moodHistory` is written by `WeekFinalizationService`
 * once per bout-processing call, but the impact merger applies the field
 * with an 'append' strategy over pre-computed tail slices, so the stored
 * array repeats each week's entry several times (verified vs a live
 * autosim — ~6 entries/week) and can arrive out of order. Dedupe by week,
 * last write wins (the week's final mood — it becomes `state.crowdMood`),
 * sort ascending. Malformed entries dropped for legacy saves. Pure so it
 * can be unit-tested without the store.
 */
export function buildMoodTrail(
  history: { week: number; mood: CrowdMood }[] | undefined,
  limit: number = MOOD_TRAIL_LIMIT
): { week: number; mood: CrowdMood }[] {
  if (!Array.isArray(history) || history.length === 0) return [];
  const latest = new Map<number, CrowdMood>();
  for (const e of history) {
    if (!e || typeof e.week !== 'number' || !(e.mood in MOOD_CELL_CLASS)) continue;
    latest.set(e.week, e.mood);
  }
  return [...latest.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-limit)
    .map(([week, mood]) => ({ week, mood }));
}
