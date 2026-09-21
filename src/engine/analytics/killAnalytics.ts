/**
 * Kill Analytics — aggregates death telemetry from persisted fight summaries
 * and the graveyard. Feeds the "Mechanics of Death" panel on the Graveyard.
 */
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Defines the shape of kill analytics.
 */
export interface KillAnalytics {
  totalFights: number;
  kills: number;
  /** kills / totalFights */
  killRate: number;
  /** Deaths by canonical cause bucket (EXECUTION, FATAL_DAMAGE, ...). */
  byCause: Record<string, number>;
  /** Kills by the killer's fighting style (from bout winner). */
  byStyle: Record<string, number>;
  /** Kills by decisive-exchange minute bucket (Early 1-3 / Mid 4-6 / Late 7+). */
  byMinuteBand: Record<string, number>;
  /** Memorial tag frequency across recorded deaths. */
  memorialTags: Record<string, number>;
  /** Kill count by killer name (graveyard killedBy). */
  topKillers: { name: string; kills: number }[];
}

function minuteBand(minute: number | null): string | null {
  if (minute == null) return null;
  if (minute <= 3) return 'Early (min 1-3)';
  if (minute <= 6) return 'Mid (min 4-6)';
  return 'Late (min 7+)';
}

const bump = (rec: Record<string, number>, key: string | null | undefined) => {
  if (!key) return;
  rec[key] = (rec[key] ?? 0) + 1;
};

/**
 * Compute kill analytics.
 */
export function computeKillAnalytics(
  fights: FightSummary[],
  graveyard: Warrior[] = []
): KillAnalytics {
  const out: KillAnalytics = {
    totalFights: fights.length,
    kills: 0,
    killRate: 0,
    byCause: {},
    byStyle: {},
    byMinuteBand: {},
    memorialTags: {},
    topKillers: [],
  };

  for (const f of fights) {
    if (f.by !== 'Kill' && !f.isDeathEvent) continue;
    out.kills += 1;
    const killerStyle = f.winner === 'D' ? f.styleD : f.styleA;
    bump(out.byStyle, killerStyle);
    bump(out.byMinuteBand, minuteBand(f.analysis?.decisiveExchange.minute ?? null));
    for (const tag of f.deathEventData?.memorialTags ?? []) bump(out.memorialTags, tag);
  }

  const killerCounts = new Map<string, number>();
  for (const w of graveyard) {
    bump(out.byCause, w.causeOfDeath ?? w.deathCause);
    if (w.killedBy) killerCounts.set(w.killedBy, (killerCounts.get(w.killedBy) ?? 0) + 1);
  }
  out.topKillers = [...killerCounts.entries()]
    .map(([name, kills]) => ({ name, kills }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 5);

  out.killRate = out.totalFights > 0 ? out.kills / out.totalFights : 0;
  return out;
}
