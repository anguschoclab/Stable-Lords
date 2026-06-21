/**
 * Newsletter feed — collects fight cards per week and generates issues.
 */
import type { FightSummary } from '@/types/combat.types'; /**
                                                           * Defines the shape of fight card.
                                                           */

/**
 * Defines the shape of fight card.
 */
export interface FightCard {
  summary: FightSummary;
  transcript: string[];
} /**
   * Defines the shape of newsletter issue.
   */

/**
 * Defines the shape of newsletter issue.
 */
export interface NewsletterIssue {
  id: string;
  week: number;
  fights: FightCard[];
  highlights: {
    fightOfTheWeekId?: string | null;
    topMovers?: { name: string; fameDelta: number; popDelta: number }[];
  };
  styleRollups: Record<string, { w: number; l: number; k: number; pct: number; fights: number }>;
  createdAt: string;
}

function scoreFight(f: FightSummary): number {
  let s = 0;
  if (f.flashyTags?.includes('Comeback')) s += 3;
  if (f.flashyTags?.includes('Flashy')) s += 2;
  if (f.by === 'KO') s += 2;
  if (f.by === 'Kill') s += 3;
  if (f.by === 'Draw') s += 1;
  return s;
}

function computeStyleRollups(
  fights: FightCard[]
): Record<string, { w: number; l: number; k: number; pct: number; fights: number }> {
  const rollups: Record<string, { w: number; l: number; k: number; pct: number; fights: number }> =
    {};
  for (const card of fights) {
    const f = card.summary;
    const rA = rollups[f.styleA] ?? { w: 0, l: 0, k: 0, pct: 0, fights: 0 };
    rollups[f.styleA] = rA;
    const rD = rollups[f.styleD] ?? { w: 0, l: 0, k: 0, pct: 0, fights: 0 };
    rollups[f.styleD] = rD;
    rA.fights++;
    rD.fights++;

    if (f.winner === 'A') {
      rA.w++;
      rD.l++;
    } else if (f.winner === 'D') {
      rD.w++;
      rA.l++;
    }

    if (f.by === 'Kill') {
      if (f.winner === 'A') rA.k++;
      else if (f.winner === 'D') rD.k++;
    }
  }

  // Calculate percentages
  for (const key of Object.keys(rollups)) {
    const r = rollups[key];
    if (!r) continue;
    r.pct = r.fights > 0 ? Math.round((r.w / r.fights) * 100) : 0;
  }

  return rollups;
}

function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0] ?? '';
  const parts = base.split(' vs ');
  return { a: parts[0] || 'Unknown', d: parts[1] || 'Unknown' };
}

function computeTopMovers(
  fights: FightCard[]
): { name: string; fameDelta: number; popDelta: number }[] {
  const movers = new Map<string, { name: string; fameDelta: number; popDelta: number }>();

  for (const card of fights) {
    const f = card.summary;
    const n = getNamesFromTitle(f.title);
    // Track fighter A
    const existA = movers.get(f.warriorIdA) ?? { name: n.a, fameDelta: 0, popDelta: 0 };
    existA.fameDelta += f.fameDeltaA ?? 0;
    existA.popDelta += f.popularityDeltaA ?? 0;
    movers.set(f.warriorIdA, existA);

    // Track fighter D
    const existD = movers.get(f.warriorIdD) ?? { name: n.d, fameDelta: 0, popDelta: 0 };
    existD.fameDelta += f.fameDeltaD ?? 0;
    existD.popDelta += f.popularityDeltaD ?? 0;
    movers.set(f.warriorIdD, existD);
  }

  return [...movers.values()]
    .sort((a, b) => b.fameDelta + b.popDelta - (a.fameDelta + a.popDelta))
    .slice(0, 5);
}

const current: FightCard[] = []; /**
                                  * Newsletter feed.
                                  */

/**
 * Newsletter feed.
 */
export const NewsletterFeed = {
  appendFightResult(card: FightCard) {
    current.push(card);
  },

  closeWeekToIssue(week: number): NewsletterIssue {
    const fights = [...current];
    current.length = 0;
    return this.generateIssue(week, fights);
  },

  clear() {
    current.length = 0;
  },

  generateIssue(week: number, fights: FightCard[]): NewsletterIssue {
    let bestId: string | null = null;
    let best = -1;
    for (const c of fights) {
      const sc = scoreFight(c.summary);
      if (sc > best) {
        best = sc;
        bestId = c.summary.id;
      }
    }

    return {
      id: `issue_${week}`,
      week,
      fights,
      highlights: {
        fightOfTheWeekId: bestId,
        topMovers: computeTopMovers(fights),
      },
      styleRollups: computeStyleRollups(fights),
      createdAt: new Date(Date.UTC(2024, 0, 1 + week * 7)).toISOString(),
    };
  },
};
