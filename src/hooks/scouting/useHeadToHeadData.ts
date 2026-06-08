import { useMemo } from 'react';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import type { Warrior } from '@/types/game';

interface HeadToHeadDataProps {
  rosterA: Warrior[];
  rosterB: Warrior[];
}

interface HeadToHeadData {
  h2hReversed: any[];
  winsA: number;
  winsB: number;
  draws: number;
  h2hLength: number;
}

/**
 * Hook for processing head-to-head fight history data.
 * Optimized for performance with single O(N) pass through fight data.
 * @param rosterA - First roster of warriors
 * @param rosterB - Second roster of warriors
 * @returns Processed head-to-head statistics and fight data
 */
export function useHeadToHeadData({ rosterA, rosterB }: HeadToHeadDataProps): HeadToHeadData {
  const allFights = useMemo(() => ArenaHistory.all() || [], []);
  const idsA = useMemo(() => new Set(rosterA.map((w) => w.id)), [rosterA]);
  const idsB = useMemo(() => new Set(rosterB.map((w) => w.id)), [rosterB]);

  // ⚡ Bolt: Reduced multiple O(N) array filter/slice/reverse operations into a single O(N) pass
  // with a pre-reversed list to prevent blocking the render loop.
  const { h2hReversed, winsA, winsB, draws } = useMemo(() => {
    const reversed = [];
    let wA = 0;
    let wB = 0;
    let d = 0;

    for (let i = allFights.length - 1; i >= 0; i--) {
      const f = allFights[i];
      if (!f) continue;
      const idA = f.warriorIdA;
      const idD = f.warriorIdD;
      const aIsA = idsA.has(idA);

      if (aIsA && idsB.has(idD)) {
        reversed.push(f);
        if (f.winner === 'A') wA++;
        else if (f.winner === 'D') wB++;
        else d++;
      } else if (idsA.has(idD) && idsB.has(idA)) {
        reversed.push(f);
        if (f.winner === 'D') wA++;
        else if (f.winner === 'A') wB++;
        else d++;
      }
    }

    return { h2hReversed: reversed, winsA: wA, winsB: wB, draws: d };
  }, [allFights, idsA, idsB]);

  const h2hLength = h2hReversed.length;

  return {
    h2hReversed,
    winsA,
    winsB,
    draws,
    h2hLength,
  };
}
