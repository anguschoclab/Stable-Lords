/**
 * Arena history — persists fight summaries to localStorage.
 */
import type { FightSummary } from '@/types/combat.types';
import { FightSummarySchema } from '@/schemas/gameStateSchema';
import { handleLocalStorageQuotaError } from '@/utils/storage';

const KEY = 'sl.arenaHistory';

function load(): FightSummary[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return FightSummarySchema.array().parse(parsed) as FightSummary[];
  } catch {
    return [];
  }
}

function save(arr: FightSummary[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    handleLocalStorageQuotaError(KEY, arr);
  } catch (error) {
    console.error('Failed to save arena history', error);
  }
}

/**
 * Arena history.
 */
export const ArenaHistory = {
  all(): FightSummary[] {
    return load();
  },

  append(summary: FightSummary) {
    const arr = load();
    arr.push(summary);
    while (arr.length > 500) arr.shift();

    const cleaned = arr.map((f, i, array) => {
      if (array.length - i > 20 && f.transcript) {
        const { transcript, ...rest } = f;
        return rest as FightSummary;
      }
      return f;
    });

    save(cleaned);
  },

  query(opts: { week?: number; warriorName?: string } = {}): FightSummary[] {
    let arr = load();
    if (opts.week != null) arr = arr.filter((f) => f.week === opts.week);
    if (opts.warriorName) {
      arr = arr.filter((f) => {
        const base = f.title.split(' (')[0] ?? '';
        const names = base.split(' vs ');
        return names[0] === opts.warriorName || names[1] === opts.warriorName;
      });
    }
    return arr;
  },
};
