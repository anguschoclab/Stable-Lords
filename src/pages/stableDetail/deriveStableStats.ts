import { isActive, isDead } from '@/engine/warrior/warriorStatus';
import type { FightSummary, RivalStableData } from '@/types/game';
import type { TierConfig } from './sections';

const TIER_CONFIG: Record<string, TierConfig> = {
  Legendary: { label: 'Legendary', ring: 'gold', text: 'text-arena-gold' },
  Major: { label: 'Major', ring: 'blood', text: 'text-primary' },
  Established: { label: 'Established', ring: 'silver', text: 'text-foreground' },
  Minor: { label: 'Minor', ring: 'bronze', text: 'text-muted-foreground' },
};

/**
 * Career aggregates, tier config, and recent-bout slice for a rival stable.
 */
export function deriveStableStats(rival: RivalStableData, arenaHistory: FightSummary[]) {
  const activeRoster = rival.roster.filter(isActive);
  const deadWarriors = rival.roster.filter(isDead);
  const {
    wins: totalWins,
    losses: totalLosses,
    kills: totalKills,
  } = rival.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );
  const totalFights = totalWins + totalLosses;
  const winRate = totalFights > 0 ? Math.round((totalWins / totalFights) * 100) : 0;

  const tierCfg = TIER_CONFIG[rival.tier ?? 'Minor'] ??
    TIER_CONFIG.Minor ?? {
      label: 'Minor',
      ring: 'bronze' as const,
      text: 'text-muted-foreground',
    };

  const stableWarriorIds = new Set<string>(rival.roster.map((w) => w.id));
  const recentBouts = arenaHistory
    .filter((f) => stableWarriorIds.has(f.warriorIdA) || stableWarriorIds.has(f.warriorIdD))
    .slice(-12)
    .reverse();

  return {
    activeRoster,
    deadWarriors,
    totalWins,
    totalLosses,
    totalKills,
    winRate,
    tierCfg,
    stableWarriorIds,
    recentBouts,
  };
}
