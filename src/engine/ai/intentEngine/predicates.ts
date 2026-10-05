import type { RivalStableData, AIIntent } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { computePlayerThreatLevel } from '../agentCore';
import { isActive } from '@/engine/warrior/warriorStatus';
import { isTournamentPrepWeek } from '@/engine/core/absoluteWeek';
import { objectiveStillViable } from '../plan/seasonPlan';
import { aiFeature } from '../featureFlags';
import { projectedWeeklyUpkeep } from '../workers/budgetWorker';
import { findGrudge, type IntentContext } from './context';

/** Weather Pivot: precision-heavy stables sit out hazardous weather. */
export function weatherPivotApplies(ctx: IntentContext): boolean {
  const precisionHeavy =
    ctx.activeRoster.length === 0 || ctx.lungeCount / ctx.activeRoster.length >= 0.5;
  return ctx.isHazardousWeather && precisionHeavy && ctx.personality !== 'Aggressive';
}

/**
 * SURVIVAL: the deeper crisis tier below RECOVERY. A stable that cannot
 * cover its projected weekly burn AND has a proven losing record is past
 * belt-tightening — it hunkers rather than merely ducking risk.
 * A young stable with no season record stays in RECOVERY's band.
 */
export function survivalApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury < projectedWeeklyUpkeep(ctx.rival) &&
    ctx.seasonWinRate !== null &&
    ctx.seasonWinRate < 0.5
  );
}

/** RECOVERY: high priority if the stable is in crisis or the season is going badly. */
export function recoveryApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury < 200 ||
    (ctx.activeRoster.length > 0 && ctx.injuryCount / ctx.activeRoster.length >= 0.4) ||
    (ctx.metaIsHostile && ctx.personality === 'Methodical') ||
    (ctx.seasonWinRate !== null && ctx.seasonWinRate < 0.3)
  );
}

/** VENDETTA: a high-intensity grudge or a dominant player can trigger the feud. */
export function vendettaApplies(ctx: IntentContext, rngService: IRNGService): boolean {
  const hasGrudge = findGrudge(ctx.state.grudgeMap, ctx.rival.owner.id) !== undefined;

  const playerThreat = computePlayerThreatLevel(ctx.state);
  const playerThreatVendettaChance =
    playerThreat === 'Dominant' &&
    (ctx.personality === 'Aggressive' ||
      ctx.personality === 'Showman' ||
      ctx.personality === 'Tactician')
      ? 0.25
      : 0;

  const vendettaChance =
    ctx.personality === 'Aggressive' ? 0.4 : ctx.personality === 'Showman' ? 0.2 : 0.1;
  if (hasGrudge && rngService.next() < vendettaChance) return true;
  return playerThreatVendettaChance > 0 && rngService.next() < playerThreatVendettaChance;
}

/**
 * Stage C — the season objective's servicing intent. Crisis picks
 * (weather/vendetta/recovery) outrank it; below them the plan-of-record
 * steers the week: CROWN campaigns bypass the 400g crown floor while the
 * assessment lives, TREASURY banks, REBUILD recruits.
 */
export function objectiveServicingIntent(ctx: IntentContext): AIIntent | undefined {
  const obj = aiFeature('AI_SEASON_PLANS') ? ctx.rival.agentMemory?.seasonObjective : undefined;
  if (!obj || !objectiveStillViable(ctx.rival, ctx.state)) return undefined;
  switch (obj.kind) {
    case 'CROWN':
      return ctx.rival.agentMemory?.crownAssessment ? 'CROWN_CAMPAIGN' : undefined;
    case 'TREASURY':
      return 'WEALTH_ACCUMULATION';
    case 'REBUILD': {
      const minSize = ctx.personality === 'Aggressive' ? 8 : ctx.personality === 'Methodical' ? 5 : 6;
      return ctx.activeRoster.length < minSize ? 'EXPANSION' : 'CONSOLIDATION';
    }
    case 'TOURNAMENT':
      return isTournamentPrepWeek(ctx.state.week) ? 'TOURNAMENT_CAMPAIGN' : undefined;
  }
}

/** TOURNAMENT_CAMPAIGN: healthy stables peak in the tournament run-up (G13). */
export function tournamentCampaignApplies(ctx: IntentContext): boolean {
  return (
    isTournamentPrepWeek(ctx.state.week) &&
    ctx.activeRoster.length >= 3 &&
    ctx.rival.treasury >= 400
  );
}

/** CROWN_CAMPAIGN: the crown worker's assessment found a winnable throne. */
export function crownCampaignPicked(ctx: IntentContext): boolean {
  const crownTarget = ctx.rival.agentMemory?.crownAssessment;
  return (
    !!crownTarget &&
    ctx.rival.treasury >= 400 &&
    ctx.state.arenaChampions?.[crownTarget.arenaId]?.champion?.warriorId !== crownTarget.warriorId
  );
}

/** WEALTH_ACCUMULATION: thriving stables hoard cash. */
export function wealthAccumulationApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury > 1500 &&
    ctx.seasonWinRate !== null &&
    ctx.seasonWinRate >= 0.6 &&
    (ctx.personality === 'Methodical' || ctx.personality === 'Pragmatic')
  );
}

/** AGGRESSIVE_EXPANSION: dominant Aggressive stables push for prestige bouts. */
export function aggressiveExpansionApplies(ctx: IntentContext): boolean {
  const maxRosterSize = ctx.personality === 'Aggressive' ? 10 : 8;
  return (
    ctx.activeRoster.length >= maxRosterSize &&
    ctx.rival.treasury > 1200 &&
    ctx.personality === 'Aggressive'
  );
}

/** ROSTER_DIVERSITY: stables concentrated in a meta-losing style diversify. */
export function rosterDiversityApplies(ctx: IntentContext): boolean {
  const allStyles = ctx.activeRoster.map((w) => w.style);
  if (allStyles.length < 4) return false;

  const styleCounts: Record<string, number> = {};
  let dominantStyle: FightingStyle | null = null;
  let maxCount = -1;

  // ⚡ Bolt: Replaced chained mapping and Object.entries().reduce() with a single-pass loop.
  // This avoids intermediate allocations and finds the dominant style directly in O(N).
  for (let i = 0; i < allStyles.length; i++) {
    const s = allStyles[i];
    if (s === undefined) continue;
    const count = (styleCounts[s] || 0) + 1;
    styleCounts[s] = count;
    if (count > maxCount) {
      maxCount = count;
      dominantStyle = s;
    }
  }

  const maxConcentration = maxCount / allStyles.length;
  return !!dominantStyle && maxConcentration >= 0.5 && (ctx.meta[dominantStyle] ?? 0) <= -3;
}

/** EXPANSION: thin roster — boosted if a known rival has grown recently. */
export function expansionApplies(ctx: IntentContext): boolean {
  const minSize = ctx.personality === 'Aggressive' ? 8 : ctx.personality === 'Methodical' ? 5 : 6;
  const knownRivals = ctx.rival.agentMemory?.knownRivals ?? [];
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalsByOwnerId = new Map<string, RivalStableData>();
  for (const rv of ctx.state.rivals || []) {
    rivalsByOwnerId.set(rv.owner.id, rv);
  }
  const rivalExpanding = knownRivals.some((rivalId) => {
    const r = rivalsByOwnerId.get(rivalId);
    if (!r || !r.agentMemory?.seasonRecord) return false;
    return (
      r.roster.reduce((count, w) => (isActive(w) ? count + 1 : count), 0) >
      r.agentMemory.seasonRecord.rosterSizeAtSeasonStart + 1
    );
  });
  const expansionThreshold = rivalExpanding ? Math.floor(minSize * 0.8) : minSize;
  return ctx.activeRoster.length < expansionThreshold && ctx.rival.treasury > 300;
}
