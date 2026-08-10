/**
 * Gazette Detection Functions - Detects patterns in fight data for gazette generation
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import type { FightSummary } from '@/types/combat.types';
import type { WarriorId } from '@/types/shared.types'; /**
 * Defines the shape of gazette detections.
 */

/**
 * Extract warrior display names from the FightSummary title.
 * Title format: "${nameA} vs ${nameB}" or "${nameA} vs ${nameB} (${tournament})"
 */
function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0] ?? '';
  const parts = base.split(' vs ');
  return { a: parts[0] || 'Unknown', d: parts[1] || 'Unknown' };
}

/**
 * Defines the shape of gazette detections.
 */
export interface GazetteDetections {
  tags: string[];
  hotStreakers: { name: string; streak: number }[];
  rivalryPair: { a: string; b: string; count: number } | null;
  risingStars: string[];
  upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[];
  /** Warriors whose first-ever bout is among this week's fights. */
  debuts?: string[];
}

/**
 * Pre-computed fight analysis context shared across detection functions.
 * Built in a single pass over `allFights` by `computeFightAnalysis`.
 */
export interface FightAnalysisContext {
  streaks: Map<WarriorId, number>;
  priorWarriorIds: Set<WarriorId>;
  warriorStats: Map<WarriorId, { total: number; wins: number }>;
  pairCounts: Map<string, number>;
}

/**
 * Compute all fight analysis structures in a single pass over `allFights`.
 * `allFights` is assumed to be ordered chronologically, with `weekFights` forming its tail.
 */
export function computeFightAnalysis(
  weekFights: FightSummary[],
  allFights: FightSummary[]
): FightAnalysisContext {
  const priorCount = Math.max(0, allFights.length - weekFights.length);
  const streaks = new Map<WarriorId, number>();
  const priorWarriorIds = new Set<WarriorId>();
  const warriorStats = new Map<WarriorId, { total: number; wins: number }>();
  const pairCounts = new Map<string, number>();

  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;

    // priorWarriorIds: only from fights before the week's tail
    if (i < priorCount) {
      priorWarriorIds.add(f.warriorIdA);
      priorWarriorIds.add(f.warriorIdD);
    }

    // streaks: identical logic to computeStreaks
    if (f.winner === 'A') {
      const aStreak = streaks.get(f.warriorIdA) ?? 0;
      const dStreak = streaks.get(f.warriorIdD) ?? 0;
      streaks.set(f.warriorIdA, aStreak >= 0 ? aStreak + 1 : 1);
      streaks.set(f.warriorIdD, dStreak <= 0 ? dStreak - 1 : -1);
    } else if (f.winner === 'D') {
      const aStreak = streaks.get(f.warriorIdA) ?? 0;
      const dStreak = streaks.get(f.warriorIdD) ?? 0;
      streaks.set(f.warriorIdD, dStreak >= 0 ? dStreak + 1 : 1);
      streaks.set(f.warriorIdA, aStreak <= 0 ? aStreak - 1 : -1);
    } else {
      streaks.set(f.warriorIdA, 0);
      streaks.set(f.warriorIdD, 0);
    }

    // warriorStats: total fights and wins per warrior
    const aStats = warriorStats.get(f.warriorIdA);
    if (aStats) {
      aStats.total++;
      if (f.winner === 'A') aStats.wins++;
    } else {
      warriorStats.set(f.warriorIdA, { total: 1, wins: f.winner === 'A' ? 1 : 0 });
    }
    const dStats = warriorStats.get(f.warriorIdD);
    if (dStats) {
      dStats.total++;
      if (f.winner === 'D') dStats.wins++;
    } else {
      warriorStats.set(f.warriorIdD, { total: 1, wins: f.winner === 'D' ? 1 : 0 });
    }

    // pairCounts: normalized min||max key
    const key =
      f.warriorIdA < f.warriorIdD
        ? `${f.warriorIdA}||${f.warriorIdD}`
        : `${f.warriorIdD}||${f.warriorIdA}`;
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  return { streaks, priorWarriorIds, warriorStats, pairCounts };
}

/**
 * Detect warriors making their debut this week — i.e. warriors who appear in
 * `weekFights` but have no earlier appearance in `allFights`. Uses pre-computed
 * `priorWarriorIds` from `FightAnalysisContext`.
 */
export function detectDebuts(weekFights: FightSummary[], ctx: FightAnalysisContext): string[] {
  const names = new Set<string>();
  for (const f of weekFights) {
    if (!f) continue;
    const n = getNamesFromTitle(f.title);
    if (!ctx.priorWarriorIds.has(f.warriorIdA)) names.add(n.a);
    if (!ctx.priorWarriorIds.has(f.warriorIdD)) names.add(n.d);
  }
  return [...names];
}

/**
 * Compute current win streaks from fight history.
 * Keys streaks by warriorId for stable identity tracking.
 */
export function computeStreaks(allFights: FightSummary[]): Map<WarriorId, number> {
  const streaks = new Map<WarriorId, number>();
  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (f.winner === 'A') {
      const aStreak = streaks.get(f.warriorIdA) ?? 0;
      const dStreak = streaks.get(f.warriorIdD) ?? 0;
      streaks.set(f.warriorIdA, aStreak >= 0 ? aStreak + 1 : 1);
      streaks.set(f.warriorIdD, dStreak <= 0 ? dStreak - 1 : -1);
    } else if (f.winner === 'D') {
      const aStreak = streaks.get(f.warriorIdA) ?? 0;
      const dStreak = streaks.get(f.warriorIdD) ?? 0;
      streaks.set(f.warriorIdD, dStreak >= 0 ? dStreak + 1 : 1);
      streaks.set(f.warriorIdA, aStreak <= 0 ? aStreak - 1 : -1);
    } else {
      streaks.set(f.warriorIdA, 0);
      streaks.set(f.warriorIdD, 0);
    }
  }
  return streaks;
}

/**
 * Detect if any fight this week involves warriors who have faced each other 3+ times.
 * Uses pre-computed `pairCounts` from `FightAnalysisContext`.
 */
export function detectRivalryMatchup(
  weekFights: FightSummary[],
  ctx: FightAnalysisContext
): { a: string; b: string; count: number } | null {
  let best: { a: string; b: string; count: number } | null = null;
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    const key =
      f.warriorIdA < f.warriorIdD
        ? `${f.warriorIdA}||${f.warriorIdD}`
        : `${f.warriorIdD}||${f.warriorIdA}`;
    const count = ctx.pairCounts.get(key) ?? 0;
    if (count >= 3 && (!best || count > best.count)) {
      const n = getNamesFromTitle(f.title);
      best = { a: n.a, b: n.d, count };
    }
  }
  return best;
}

/**
 * Detect gazette tags from fights and detections.
 */
export function detectGazetteTags(fights: FightSummary[], detections: GazetteDetections): string[] {
  const tags: string[] = [];
  const kills = fights.filter((f) => f.by === 'Kill');
  const knockouts = fights.filter((f) => f.by === 'KO');

  if (kills.length >= 2) tags.push('Bloodbath');
  if (fights.some((f) => f.flashyTags?.includes('Comeback'))) tags.push('Comeback');
  if (fights.some((f) => f.flashyTags?.includes('Dominance'))) tags.push('Dominance');
  if (knockouts.length >= 3) tags.push('KO Fest');
  if (detections.hotStreakers.length > 0) tags.push('Hot Streak');
  if (detections.rivalryPair) tags.push('Rivalry');
  if (detections.risingStars.length > 0) tags.push('Rising Star');
  if (detections.upsets.length > 0) tags.push('Upset');

  return tags;
}

/**
 * Detect warriors on hot streaks.
 */
export function detectHotStreakers(
  fights: FightSummary[],
  streaks: Map<WarriorId, number>
): { name: string; streak: number }[] {
  const hotStreakers: { name: string; streak: number }[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerId = f.winner === 'A' ? f.warriorIdA : f.warriorIdD;
    const s = streaks.get(winnerId) ?? 0;
    if (s >= 5) {
      const n = getNamesFromTitle(f.title);
      const winnerName = f.winner === 'A' ? n.a : n.d;
      hotStreakers.push({ name: winnerName, streak: s });
    }
  }
  return hotStreakers;
}

/**
 * Detect rising stars (3-0 warriors).
 * Uses pre-computed `warriorStats` from `FightAnalysisContext`.
 */
export function detectRisingStars(fights: FightSummary[], ctx: FightAnalysisContext): string[] {
  const risingStars: string[] = [];
  if (fights.length === 0) return risingStars;

  const candidates = new Set<WarriorId>();
  for (const f of fights) {
    if (f.winner) {
      candidates.add(f.winner === 'A' ? f.warriorIdA : f.warriorIdD);
    }
  }

  // Resolve rising star IDs back to names using fights from the week
  const risingIds = new Set<WarriorId>();
  for (const c of candidates) {
    const s = ctx.warriorStats.get(c);
    if (s && s.total === 3 && s.wins === 3) {
      risingIds.add(c);
    }
  }
  const names = new Set<string>();
  for (const f of fights) {
    const n = getNamesFromTitle(f.title);
    if (risingIds.has(f.warriorIdA)) names.add(n.a);
    if (risingIds.has(f.warriorIdD)) names.add(n.d);
  }
  return [...names];
}

/**
 * Detect upset victories.
 */
export function detectUpsets(
  fights: FightSummary[]
): { winner: string; loser: string; winnerFame: number; loserFame: number }[] {
  const upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[] = [];
  for (const f of fights) {
    if (!f.winner || f.fameA == null || f.fameD == null) continue;
    const winnerFame = f.winner === 'A' ? f.fameA : f.fameD;
    const loserFame = f.winner === 'A' ? f.fameD : f.fameA;
    const n = getNamesFromTitle(f.title);
    const winnerName = f.winner === 'A' ? n.a : n.d;
    const loserName = f.winner === 'A' ? n.d : n.a;
    if (loserFame >= winnerFame + 10 && loserFame >= winnerFame * 2) {
      upsets.push({ winner: winnerName, loser: loserName, winnerFame, loserFame });
    }
  }
  return upsets;
}
