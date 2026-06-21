import type { FightSummary } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';

/**
 *
 */
export interface LeaderboardEntry {
  name: string;
  w: number;
  l: number;
  k: number;
  fame: number;
  style: string;
  rate: number;
}

/**
 *
 */
export interface BestByStyleEntry {
  style: string;
  name: string;
  wins: number;
}

/**
 *
 */
export interface RisingStarEntry {
  name: string;
  wins: number;
  matches: number;
  firstWeek: number;
}

function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0] ?? '';
  const parts = base.split(' vs ');
  return { a: parts[0] || 'Unknown', d: parts[1] || 'Unknown' };
}

function buildNameMap(fights: FightSummary[]): Map<WarriorId, string> {
  const map = new Map<WarriorId, string>();
  for (const f of fights) {
    const n = getNamesFromTitle(f.title);
    if (!map.has(f.warriorIdA)) map.set(f.warriorIdA, n.a);
    if (!map.has(f.warriorIdD)) map.set(f.warriorIdD, n.d);
  }
  return map;
}

/**
 * Calculates leaderboard data from fight summaries.
 * Uses a bounded insertion sort (O(N)) to find top 5 warriors by wins and win rate.
 */
export function calculateLeaderboardData(allFights: FightSummary[]): LeaderboardEntry[] {
  const nameMap = buildNameMap(allFights);
  const registry = new Map<
    WarriorId,
    { w: number; l: number; k: number; fame: number; style: string }
  >();

  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;

    let aData = registry.get(f.warriorIdA);
    if (!aData) {
      aData = { w: 0, l: 0, k: 0, fame: f.fameA || 0, style: f.styleA };
      registry.set(f.warriorIdA, aData);
    }

    let dData = registry.get(f.warriorIdD);
    if (!dData) {
      dData = { w: 0, l: 0, k: 0, fame: f.fameD || 0, style: f.styleD };
      registry.set(f.warriorIdD, dData);
    }

    if (f.winner === 'A') {
      aData.w++;
      dData.l++;
      const fA = f.fameA || 0;
      if (fA > aData.fame) aData.fame = fA;
      if (fA > dData.fame) dData.fame = fA;
      if (f.by === 'Kill') aData.k++;
    } else if (f.winner === 'D') {
      dData.w++;
      aData.l++;
      const fD = f.fameD || 0;
      if (fD > dData.fame) dData.fame = fD;
      if (fD > aData.fame) dData.fame = fD;
      if (f.by === 'Kill') dData.k++;
    }
  }

  // Bounded insertion sort (Top 5) - O(N) instead of O(N log N)
  const result: LeaderboardEntry[] = [];
  for (const [id, data] of registry.entries()) {
    const rate = data.w / (data.w + data.l || 1);
    const entry = {
      name: nameMap.get(id) || 'Unknown',
      w: data.w,
      l: data.l,
      k: data.k,
      fame: data.fame,
      style: data.style,
      rate,
    };

    let i = result.length - 1;
    while (i >= 0) {
      const current = result[i];
      if (
        current &&
        (entry.w > current.w || (entry.w === current.w && entry.rate > current.rate))
      ) {
        i--;
      } else {
        break;
      }
    }
    result.splice(i + 1, 0, entry);
    if (result.length > 5) result.pop();
  }

  return result;
}

/**
 * Calculates best warriors by style from fight summaries.
 */
export function calculateBestByStyle(
  allFights: FightSummary[],
  styles: string[]
): BestByStyleEntry[] {
  const nameMap = buildNameMap(allFights);
  return styles.map((style) => {
    const warriors: Record<WarriorId, number> = {};
    for (let i = 0; i < allFights.length; i++) {
      const f = allFights[i];
      if (!f) continue;
      let wStyle: string | null = null;
      let wId: WarriorId | null = null;

      if (f.winner === 'A') {
        wStyle = f.styleA;
        wId = f.warriorIdA;
      } else if (f.winner === 'D') {
        wStyle = f.styleD;
        wId = f.warriorIdD;
      }

      if (wStyle === style && wId) {
        warriors[wId] = (warriors[wId] || 0) + 1;
      }
    }
    let topId: WarriorId | null = null;
    let topWins = 0;
    for (const [id, wins] of Object.entries(warriors)) {
      if (wins > topWins) {
        topWins = wins;
        topId = id as WarriorId;
      }
    }
    return { style, name: topId ? nameMap.get(topId) || 'Unknown' : 'No Data', wins: topWins };
  });
}

/**
 * Calculates rising stars (emerging warriors) from fight summaries.
 * Uses bounded insertion sort (O(N)) to find top 3 warriors with <= 5 matches and >= 3 wins.
 */
export function calculateRisingStars(allFights: FightSummary[]): RisingStarEntry[] {
  const nameMap = buildNameMap(allFights);
  const history = new Map<WarriorId, { wins: number; matches: number; firstWeek: number }>();

  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;

    let aData = history.get(f.warriorIdA);
    if (!aData) {
      aData = { wins: 0, matches: 0, firstWeek: f.week };
      history.set(f.warriorIdA, aData);
    }

    let dData = history.get(f.warriorIdD);
    if (!dData) {
      dData = { wins: 0, matches: 0, firstWeek: f.week };
      history.set(f.warriorIdD, dData);
    }

    aData.matches++;
    dData.matches++;

    if (f.winner === 'A') aData.wins++;
    else if (f.winner === 'D') dData.wins++;
  }

  // Bounded insertion sort (Top 3) - O(N) instead of O(N log N)
  const result: RisingStarEntry[] = [];
  for (const [id, data] of history.entries()) {
    if (data.matches <= 5 && data.wins >= 3) {
      const entry = {
        name: nameMap.get(id) || 'Unknown',
        wins: data.wins,
        matches: data.matches,
        firstWeek: data.firstWeek,
      };
      let i = result.length - 1;
      while (i >= 0) {
        const current = result[i];
        if (current && entry.wins > current.wins) {
          i--;
        } else {
          break;
        }
      }
      result.splice(i + 1, 0, entry);
      if (result.length > 3) result.pop();
    }
  }

  return result;
}
