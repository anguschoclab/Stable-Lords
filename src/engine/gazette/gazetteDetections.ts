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
  const base = title.split(' (')[0]!;
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
 * Detect warriors making their debut this week — i.e. warriors who appear in
 * `weekFights` but have no earlier appearance in `allFights`. `allFights` is
 * assumed to be ordered chronologically, with `weekFights` forming its tail.
 */
export function detectDebuts(weekFights: FightSummary[], allFights: FightSummary[]): string[] {
  const priorCount = Math.max(0, allFights.length - weekFights.length);
  const priorIds = new Set<WarriorId>();
  for (let i = 0; i < priorCount; i++) {
    const f = allFights[i];
    if (!f) continue;
    priorIds.add(f.warriorIdA);
    priorIds.add(f.warriorIdD);
  }
  const debutIds = new Set<WarriorId>();
  for (const f of weekFights) {
    if (!priorIds.has(f.warriorIdA)) debutIds.add(f.warriorIdA);
    if (!priorIds.has(f.warriorIdD)) debutIds.add(f.warriorIdD);
  }
  // Resolve IDs back to names using title for display
  const names = new Set<string>();
  for (const f of weekFights) {
    const n = getNamesFromTitle(f.title);
    if (debutIds.has(f.warriorIdA)) names.add(n.a);
    if (debutIds.has(f.warriorIdD)) names.add(n.d);
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
 */
export function detectRivalryMatchup(
  weekFights: FightSummary[],
  allFights: FightSummary[]
): { a: string; b: string; count: number } | null {
  const candidatePairs = new Set<string>();
  const ids = new Set<WarriorId>();
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    candidatePairs.add(
      f.warriorIdA < f.warriorIdD
        ? `${f.warriorIdA}||${f.warriorIdD}`
        : `${f.warriorIdD}||${f.warriorIdA}`
    );
    ids.add(f.warriorIdA);
    ids.add(f.warriorIdD);
  }

  const pairCounts = new Map<string, number>();
  for (const key of candidatePairs) {
    pairCounts.set(key, 0);
  }

  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (ids.has(f.warriorIdA) && ids.has(f.warriorIdD)) {
      const key =
        f.warriorIdA < f.warriorIdD
          ? `${f.warriorIdA}||${f.warriorIdD}`
          : `${f.warriorIdD}||${f.warriorIdA}`;
      const currentCount = pairCounts.get(key);
      if (currentCount !== undefined) {
        pairCounts.set(key, currentCount + 1);
      }
    }
  }

  let best: { a: string; b: string; count: number } | null = null;
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    const key =
      f.warriorIdA < f.warriorIdD
        ? `${f.warriorIdA}||${f.warriorIdD}`
        : `${f.warriorIdD}||${f.warriorIdA}`;
    const count = pairCounts.get(key) ?? 0;
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
 */
export function detectRisingStars(fights: FightSummary[], allFights: FightSummary[]): string[] {
  const risingStars: string[] = [];
  if (!allFights || fights.length === 0) return risingStars;

  const candidates = new Set<WarriorId>();
  for (const f of fights) {
    if (f.winner) {
      candidates.add(f.winner === 'A' ? f.warriorIdA : f.warriorIdD);
    }
  }

  const stats = new Map<WarriorId, { total: number; wins: number }>();
  for (const c of candidates) {
    stats.set(c, { total: 0, wins: 0 });
  }

  for (const af of allFights) {
    if (candidates.has(af.warriorIdA)) {
      const s = stats.get(af.warriorIdA);
      if (s) {
        s.total++;
        if (af.winner === 'A') s.wins++;
      }
    }
    if (candidates.has(af.warriorIdD)) {
      const s = stats.get(af.warriorIdD);
      if (s) {
        s.total++;
        if (af.winner === 'D') s.wins++;
      }
    }
  }

  // Resolve rising star IDs back to names using fights from the week
  const risingIds = new Set<WarriorId>();
  for (const c of candidates) {
    const s = stats.get(c);
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
