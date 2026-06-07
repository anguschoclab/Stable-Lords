import type { Rivalry } from '@/types/state.types';
import type { StableId, RivalryId } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { MatchScoringService } from '../matchmakingServices';
import { calculateRivalryScore } from '../ownerGrudges';
import { getStablePairKey } from '@/utils/keyUtils';

function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0]!;
  const parts = base.split(' vs ');
  return { a: parts[0] || 'Unknown', d: parts[1] || 'Unknown' };
}

/**
 * Detects and updates rivalries based on recent bouts, deaths, and upsets.
 */
interface PairingStats {
  stableIdA: StableId;
  stableIdB: StableId;
  bouts: number;
  deaths: number;
  upsets: number;
  lastReason: string;
  aFame: number;
  dFame: number;
}

/**
 * Helper to aggregate match stats and upset records for stable pairings from week fights.
 */
function aggregatePairingStats(weekFights: FightSummary[], week: number): Map<string, PairingStats> {
  const pairs = new Map<string, PairingStats>();

  for (const f of weekFights) {
    if (!f.stableIdA || !f.stableIdD) continue;
    const key = getStablePairKey(f.stableIdA, f.stableIdD);
    const entry = pairs.get(key) ?? {
      stableIdA: f.stableIdA,
      stableIdB: f.stableIdD,
      bouts: 0,
      deaths: 0,
      upsets: 0,
      lastReason: '',
      aFame: f.fameA || 0,
      dFame: f.fameD || 0,
    };

    const n = getNamesFromTitle(f.title);
    entry.bouts++;
    if (f.by === 'Kill') {
      entry.deaths++;
      entry.lastReason = `${f.winner === 'A' ? n.a : n.d} killed ${f.winner === 'A' ? n.d : n.a} in Week ${week}`;
    }

    if (f.winner && f.fameA !== undefined && f.fameD !== undefined) {
      const winnerFame = f.winner === 'A' ? f.fameA : f.fameD;
      const loserFame = f.winner === 'A' ? f.fameD : f.fameA;
      if (loserFame > winnerFame + 20) {
        entry.upsets++;
        if (!entry.lastReason || f.by !== 'Kill') {
          entry.lastReason = `${f.winner === 'A' ? n.a : n.d} upset ${f.winner === 'A' ? n.d : n.a} in Week ${week}`;
        }
      }
    }
    pairs.set(key, entry);
  }

  return pairs;
}

/**
 * Helper to process and apply intensity updates to existing or newly created rivalries.
 */
function processRivalryUpdates(
  pairs: Map<string, PairingStats>,
  rivalries: Rivalry[],
  week: number,
  rng: IRNGService
): void {
  for (const [, data] of pairs.entries()) {
    const existing = rivalries.find(
      (r) =>
        (r.stableIdA === data.stableIdA && r.stableIdB === data.stableIdB) ||
        (r.stableIdB === data.stableIdA && r.stableIdA === data.stableIdB)
    );

    const rawDelta = calculateRivalryScore(data.bouts, data.deaths, data.upsets);
    const intensityDelta =
      MatchScoringService.calculatePairingScore({
        p_fame: data.aFame || 0,
        r_fame: data.dFame || 0,
        playerStableId: data.stableIdA,
        rivalStableId: data.stableIdB,
        week: week,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: false,
        rng: () => rng.next(),
      }) > 200
        ? 2
        : 1;

    if (existing) {
      // Direct update using the canonical score, clamped to 5
      existing.intensity = Math.max(
        existing.intensity,
        Math.min(5, existing.intensity + intensityDelta + (rawDelta - 1))
      );
      if (data.deaths > 0 || data.upsets > 0) {
        existing.reason = data.lastReason || existing.reason;
      }
    } else if (data.bouts >= 1) {
      // Any clash can start a rivalry
      rivalries.push({
        id: rng.uuid('rivalry') as RivalryId,
        stableIdA: data.stableIdA,
        stableIdB: data.stableIdB,
        intensity: Math.min(5, intensityDelta + (rawDelta - 1)),
        reason: data.lastReason || `Clashed in the arena`,
        startWeek: week,
      });
    }
  }
}

/**
 * Detects and updates rivalries based on recent bouts, deaths, and upsets.
 */
export function updateRivalriesFromBouts(
  existingRivalries: Rivalry[],
  weekFights: FightSummary[],
  week: number,
  rng: IRNGService
): Rivalry[] {
  const rivalries = [...existingRivalries];
  const pairs = aggregatePairingStats(weekFights, week);
  processRivalryUpdates(pairs, rivalries, week, rng);
  return rivalries;
}
