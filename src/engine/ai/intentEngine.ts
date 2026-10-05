import type { GameState, RivalStableData, AIIntent, AIStrategy } from '@/types/state.types';
import { computeMetaDrift } from '../analytics/metaDrift';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService, resolveRng } from '@/utils/random';
import { computePlayerThreatLevel } from './agentCore';
import { hasInjuries } from '@/engine/injuries/utils';
import { isActive } from '@/engine/warrior/warriorStatus';
import { HAZARDOUS_WEATHER } from './weatherSuitability';
import { isTournamentPrepWeek } from '@/engine/core/absoluteWeek';
import { objectiveStillViable } from './plan/seasonPlan';
import { aiFeature } from './featureFlags';
import { projectedWeeklyUpkeep } from './workers/budgetWorker';

/**
 * Finds a high-intensity grudge (>= 3) involving the given owner.
 * Uses fast iterator search with early break — no intermediate array allocation.
 */
function findGrudge(
  grudgeMap: GameState['grudgeMap'],
  ownerId: string
): import('@/types/state.types').OwnerGrudge | undefined {
  if (!grudgeMap) return undefined;
  for (const g of grudgeMap.values()) {
    // Intensity 2 is already a blood feud — grudges are only created by a
    // kill (or a player upset), so a live grudge is itself the grievance.
    // Requiring 3+ demands a second kill on the same pair, which honest
    // lethality rates make unreachable; decayed grudges floor at 1 and stop
    // feeding vendettas.
    if ((g.ownerIdA === ownerId || g.ownerIdB === ownerId) && g.intensity >= 2) {
      return g;
    }
  }
  return undefined;
}

/**
 * Shared facts the intent rules reason over — computed once per pick.
 */
interface IntentContext {
  rival: RivalStableData;
  state: GameState;
  personality: string;
  activeRoster: RivalStableData['roster'];
  injuryCount: number;
  lungeCount: number;
  isHazardousWeather: boolean;
  meta: Record<string, number>;
  metaIsHostile: boolean;
  seasonWinRate: number | null;
}

function buildIntentContext(rival: RivalStableData, state: GameState): IntentContext {
  const personality = rival.owner.personality ?? 'Pragmatic';
  const { activeRoster, injuryCount, lungeCount } = rival.roster.reduce(
    (acc, w) => {
      if (!isActive(w)) return acc;
      acc.activeRoster.push(w);
      if (hasInjuries(w)) acc.injuryCount++;
      if (w.style === 'LUNGING ATTACK') acc.lungeCount++;
      return acc;
    },
    { activeRoster: [] as typeof rival.roster, injuryCount: 0, lungeCount: 0 }
  );

  // ⚡ Environmental Awareness — consolidated hazard list (G16)
  const isHazardousWeather = HAZARDOUS_WEATHER.includes(state.weather ?? 'Clear');

  // ⚡ Continuous Alignment: Meta-Drift Awareness — the agent reasons over its
  // *perceived* meta (lagged intel from createAgentContext), not omniscience.
  const perceived = rival.agentMemory?.metaAwareness;
  const meta =
    perceived && Object.keys(perceived).length > 0
      ? perceived
      : state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
  const favoredStyles = rival.owner.favoredStyles || [];
  const metaIsHostile = favoredStyles.some((s) => (meta[s] || 0) < -2);

  const seasonRecord = rival.agentMemory?.seasonRecord;
  const seasonFightsPlayed = (seasonRecord?.wins ?? 0) + (seasonRecord?.losses ?? 0);
  const seasonWinRate =
    seasonFightsPlayed >= 6 ? (seasonRecord?.wins ?? 0) / seasonFightsPlayed : null;

  return {
    rival,
    state,
    personality,
    activeRoster,
    injuryCount,
    lungeCount,
    isHazardousWeather,
    meta,
    metaIsHostile,
    seasonWinRate,
  };
}

/** Weather Pivot: precision-heavy stables sit out hazardous weather. */
function weatherPivotApplies(ctx: IntentContext): boolean {
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
function survivalApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury < projectedWeeklyUpkeep(ctx.rival) &&
    ctx.seasonWinRate !== null &&
    ctx.seasonWinRate < 0.5
  );
}

/** RECOVERY: high priority if the stable is in crisis or the season is going badly. */
function recoveryApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury < 200 ||
    (ctx.activeRoster.length > 0 && ctx.injuryCount / ctx.activeRoster.length >= 0.4) ||
    (ctx.metaIsHostile && ctx.personality === 'Methodical') ||
    (ctx.seasonWinRate !== null && ctx.seasonWinRate < 0.3)
  );
}

/** VENDETTA: a high-intensity grudge or a dominant player can trigger the feud. */
function vendettaApplies(ctx: IntentContext, rngService: IRNGService): boolean {
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
function objectiveServicingIntent(ctx: IntentContext): AIIntent | undefined {
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
function tournamentCampaignApplies(ctx: IntentContext): boolean {
  return (
    isTournamentPrepWeek(ctx.state.week) &&
    ctx.activeRoster.length >= 3 &&
    ctx.rival.treasury >= 400
  );
}

/** CROWN_CAMPAIGN: the crown worker's assessment found a winnable throne. */
function crownCampaignPicked(ctx: IntentContext): boolean {
  const crownTarget = ctx.rival.agentMemory?.crownAssessment;
  return (
    !!crownTarget &&
    ctx.rival.treasury >= 400 &&
    ctx.state.arenaChampions?.[crownTarget.arenaId]?.champion?.warriorId !== crownTarget.warriorId
  );
}

/** WEALTH_ACCUMULATION: thriving stables hoard cash. */
function wealthAccumulationApplies(ctx: IntentContext): boolean {
  return (
    ctx.rival.treasury > 1500 &&
    ctx.seasonWinRate !== null &&
    ctx.seasonWinRate >= 0.6 &&
    (ctx.personality === 'Methodical' || ctx.personality === 'Pragmatic')
  );
}

/** AGGRESSIVE_EXPANSION: dominant Aggressive stables push for prestige bouts. */
function aggressiveExpansionApplies(ctx: IntentContext): boolean {
  const maxRosterSize = ctx.personality === 'Aggressive' ? 10 : 8;
  return (
    ctx.activeRoster.length >= maxRosterSize &&
    ctx.rival.treasury > 1200 &&
    ctx.personality === 'Aggressive'
  );
}

/** ROSTER_DIVERSITY: stables concentrated in a meta-losing style diversify. */
function rosterDiversityApplies(ctx: IntentContext): boolean {
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
function expansionApplies(ctx: IntentContext): boolean {
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

/**
 * Determines the weekly strategic intent for an AI owner.
 * Intent impacts recruitment, training, and matchmaking choices.
 */
export function pickWeeklyIntent(
  rival: RivalStableData,
  state: GameState,
  seed?: number,
  rng?: IRNGService
): AIIntent {
  const rngService = resolveRng(rng, seed ?? state.week * 131 + rival.owner.id.length);
  const ctx = buildIntentContext(rival, state);

  if (weatherPivotApplies(ctx)) return 'RECOVERY';
  // Vendetta precedes recovery: a fresh blood feud outranks belt-tightening —
  // otherwise a broke grudge-holder can never answer the grievance (RECOVERY
  // crowds the pick on every cash-strapped week).
  if (vendettaApplies(ctx, rngService)) return 'VENDETTA';
  // SURVIVAL precedes RECOVERY: insolvency-plus-losses is a deeper crisis
  // than belt-tightening, and a live grudge (checked just above) still
  // outranks it — a folding stable answers its feud, then hunkers.
  if (survivalApplies(ctx)) return 'SURVIVAL';
  if (recoveryApplies(ctx)) return 'RECOVERY';
  // The tournament prep window is a fixed calendar deadline — it must outrank
  // the season plan-of-record, or a TREASURY/REBUILD program buries it every
  // week and TOURNAMENT_CAMPAIGN can never fire.
  if (tournamentCampaignApplies(ctx)) return 'TOURNAMENT_CAMPAIGN';
  // Stage C: a live season objective is serviced by its intent — a CROWN
  // plan campaigns even through a lean week the bare cascade would skip.
  const servicing = objectiveServicingIntent(ctx);
  if (servicing) return servicing;
  if (crownCampaignPicked(ctx)) return 'CROWN_CAMPAIGN';
  if (wealthAccumulationApplies(ctx)) return 'WEALTH_ACCUMULATION';
  if (aggressiveExpansionApplies(ctx)) return 'AGGRESSIVE_EXPANSION';
  if (rosterDiversityApplies(ctx)) return 'ROSTER_DIVERSITY';
  if (expansionApplies(ctx)) return 'EXPANSION';

  // CONSOLIDATION: Default (focus on training and base maintenance)
  return 'CONSOLIDATION';
}

/**
 * ⚡ Skeptical Memory: Verifies if the current strategy still makes sense.
 * Returns true if the plan is "disproved" by current reality.
 */
export function verifyIntentSkepticism(rival: RivalStableData, state: GameState): boolean {
  const strategy = rival.strategy;
  if (!strategy) return true;

  const personality = rival.owner.personality ?? 'Pragmatic';

  // Skepticism Tier 1: Financial Crisis — RECOVERY and SURVIVAL are the
  // crisis intents themselves; holding one while broke is correct, not stale.
  if (
    strategy.intent !== 'RECOVERY' &&
    strategy.intent !== 'SURVIVAL' &&
    rival.treasury < 150
  ) {
    return true;
  }

  // Skepticism Tier 2: Roster Depletion
  const activeCount = rival.roster.reduce((count, w) => (isActive(w) ? count + 1 : count), 0);
  if (strategy.intent === 'VENDETTA' && activeCount < 3) return true;

  // Skepticism Tier 2.5: VENDETTA with no grievance and no living target —
  // a vendetta needs either a grudge or a target that still exists.
  if (strategy.intent === 'VENDETTA') {
    const hasGrudge = findGrudge(state.grudgeMap, rival.owner.id) !== undefined;
    const targetIsPlayer = strategy.targetStableId === state.player?.id;
    const targetExists =
      targetIsPlayer ||
      (state.rivals ?? []).some(
        (r) => r.id === strategy.targetStableId || r.owner.id === strategy.targetStableId
      );
    if (!hasGrudge && !targetIsPlayer && !targetExists) return true;
  }

  // Skepticism Tier 2.7: a crown campaign ends when the assessment lapses,
  // the campaign warrior is gone, or the throne is already theirs.
  if (strategy.intent === 'CROWN_CAMPAIGN' && !crownCampaignApplies(rival, state)) {
    return true;
  }

  // Skepticism Tier 2.8 (Stage C): the season objective is infeasible —
  // whatever intent it spawned gets re-picked.
  if (rival.agentMemory?.seasonObjective && !objectiveStillViable(rival, state)) {
    return true;
  }

  // Skepticism Tier 3: Meta Hostility (Methodical/Tactician agents only)
  if (personality === 'Methodical' || personality === 'Tactician') {
    const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
    const favored = rival.owner.favoredStyles || [];
    if (favored.some((s) => (meta[s] || 0) < -4)) return true;
  }

  // Skepticism Tier 4: Environmental Hazard (Strategic Abort)
  const isHazardousWeather = HAZARDOUS_WEATHER.includes(state.weather ?? 'Clear');
  let precisionHeavy = false;
  for (const w of rival.roster) {
    if (isActive(w) && w.style === 'LUNGING ATTACK') {
      precisionHeavy = true;
      break;
    }
  }
  if (
    isHazardousWeather &&
    (strategy.intent === 'VENDETTA' || strategy.intent === 'EXPANSION') &&
    precisionHeavy &&
    personality !== 'Aggressive'
  ) {
    // Strategic Abort: Pause the offensive due to bad weather
    return true;
  }

  return false;
}

/**
 * CROWN_CAMPAIGN's living condition — shared by the skepticism tier and the
 * hysteresis check so both apply identical "still campaigning" semantics.
 */
function crownCampaignApplies(rival: RivalStableData, state: GameState): boolean {
  const target = rival.agentMemory?.crownAssessment;
  if (!target || rival.treasury <= 300) return false;
  const campaignWarrior = rival.roster.find((w) => w.id === target.warriorId);
  if (!campaignWarrior || !isActive(campaignWarrior)) return false;
  // The throne is already theirs — campaign complete.
  if (state.arenaChampions?.[target.arenaId]?.champion?.warriorId === target.warriorId) {
    return false;
  }
  return true;
}

/**
 * Human-readable rationale per intent — surfaced in AgentReasoningWidget.
 */
const INTENT_REASONS: Record<AIIntent, string> = {
  RECOVERY: 'Crisis response — stabilizing before risking more bouts',
  VENDETTA: 'A blood feud demands an answer',
  SURVIVAL: 'Holding on — the stable is at the edge',
  EXPANSION: 'Roster is too thin — recruiting to fill ranks',
  CONSOLIDATION: 'Steady state — training and upkeep',
  WEALTH_ACCUMULATION: 'Thriving — banking gold while ahead',
  AGGRESSIVE_EXPANSION: 'Dominant position — pressing for prestige bouts',
  ROSTER_DIVERSITY: 'Style concentration is losing to the current meta',
  TOURNAMENT_CAMPAIGN: 'Season-ending tournament approaches — peaking the roster',
  CROWN_CAMPAIGN: 'A throne looks winnable — the stable climbs the arena ladder',
};

/**
 * Hysteresis check — relaxed re-entry conditions for the CURRENT intent.
 * When a plan merely expires (not disproved) and its trigger condition is
 * still ~met within a margin, the agent holds course rather than flickering
 * between neighboring intents week to week.
 */
export function intentStillApplies(
  rival: RivalStableData,
  state: GameState,
  intent: AIIntent
): boolean {
  const activeRoster = rival.roster.filter(isActive);
  const activeCount = activeRoster.length;
  const personality = rival.owner.personality ?? 'Pragmatic';
  const injuryCount = activeRoster.filter(hasInjuries).length;
  const seasonRecord = rival.agentMemory?.seasonRecord;
  const fights = (seasonRecord?.wins ?? 0) + (seasonRecord?.losses ?? 0);
  const winRate = fights >= 4 ? (seasonRecord?.wins ?? 0) / fights : null;

  switch (intent) {
    case 'RECOVERY':
      return (
        rival.treasury < 280 ||
        (activeCount > 0 && injuryCount / activeCount >= 0.3) ||
        (winRate !== null && winRate < 0.4)
      );
    case 'VENDETTA':
      return (
        findGrudge(state.grudgeMap, rival.owner.id) !== undefined ||
        rival.strategy?.targetStableId === state.player?.id
      );
    case 'SURVIVAL':
      // Hold while the burn still exceeds the bank — with a 25% margin so
      // a single thin purse doesn't flip the stable back to business-as-usual.
      return rival.treasury < projectedWeeklyUpkeep(rival) * 1.25;
    case 'EXPANSION': {
      const minSize = personality === 'Aggressive' ? 8 : personality === 'Methodical' ? 5 : 6;
      return activeCount < minSize + 1 && rival.treasury > 200;
    }
    case 'AGGRESSIVE_EXPANSION':
      return activeCount >= 6 && rival.treasury > 900;
    case 'WEALTH_ACCUMULATION':
      return rival.treasury > 1100;
    case 'TOURNAMENT_CAMPAIGN':
      return state.week >= 9 && state.week <= 13 && activeCount >= 3;
    case 'CROWN_CAMPAIGN':
      return crownCampaignApplies(rival, state);
    case 'ROSTER_DIVERSITY': {
      const styles = activeRoster.map((w) => w.style);
      if (styles.length < 4) return false;
      const counts = new Map<string, number>();
      let max = 0;
      let dominant: string | undefined;
      for (const s of styles) {
        const c = (counts.get(s) ?? 0) + 1;
        counts.set(s, c);
        if (c > max) {
          max = c;
          dominant = s;
        }
      }
      const perceived = rival.agentMemory?.metaAwareness;
      const meta: Record<string, number> =
        perceived && Object.keys(perceived).length > 0
          ? perceived
          : state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
      return dominant !== undefined && max / styles.length >= 0.45 && (meta[dominant] ?? 0) <= -2;
    }
    case 'CONSOLIDATION':
      return true;
  }
}

/**
 * Vendetta target: the other party in the rival's active grudge; else dossier
 * intel (whoever has beaten/threatens them most); else the player stable.
 */
function resolveVendettaTarget(
  rival: RivalStableData,
  state: GameState
): AIStrategy['targetStableId'] {
  const grudgeTarget = findGrudge(state.grudgeMap, rival.owner.id);
  if (grudgeTarget !== undefined) {
    return (
      grudgeTarget.ownerIdA === rival.owner.id ? grudgeTarget.ownerIdB : grudgeTarget.ownerIdA
    ) as AIStrategy['targetStableId'];
  }
  // No grudge target — fall back to dossier intel.
  const dossiers = rival.agentMemory?.opponentDossiers ?? {};
  let bestId: string | undefined;
  let bestScore = 0;
  for (const [id, d] of Object.entries(dossiers)) {
    const score = d.recordVs.l * 2 + d.recordVs.k * 3 + d.estimatedThreat;
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return (bestId ?? state.player?.id) as AIStrategy['targetStableId'];
}

/**
 * Updates the AI strategy, either continuing the current plan or picking a new one.
 */
export function updateAIStrategy(
  rival: RivalStableData,
  state: GameState,
  seed?: number
): AIStrategy {
  const current = rival.strategy;

  // ⚡ Skeptical Memory: Verify current plan
  const planDisproved = verifyIntentSkepticism(rival, state);

  // If no strategy, plan expired, or plan is disproved, pick a new one
  if (!current || current.planWeeksRemaining <= 0 || planDisproved) {
    const s = seed ?? state.week * 7919 + rival.owner.id.length * 13;
    const rng = new SeededRNGService(s);
    const picked = pickWeeklyIntent(rival, state, s, rng);

    // Hysteresis: a merely-expired (not disproved) plan whose condition still
    // ~applies is renewed rather than churned into a neighboring intent.
    // CONSOLIDATION is the fallback, not a real plan — `intentStillApplies`
    // returns true for it unconditionally, so without this exclusion it would
    // absorb every re-pick and the strategy could never leave the default.
    const holdCourse =
      current !== undefined &&
      !planDisproved &&
      picked !== current.intent &&
      current.intent !== 'CONSOLIDATION' &&
      intentStillApplies(rival, state, current.intent);
    const intent = holdCourse ? current.intent : picked;

    // Determine the duration of this intent
    const duration =
      intent === 'RECOVERY' || intent === 'SURVIVAL'
        ? 2
        : intent === 'VENDETTA' || intent === 'CROWN_CAMPAIGN'
          ? 6
          : intent === 'EXPANSION'
            ? 3
            : 4;

    const targetStableId = intent === 'VENDETTA' ? resolveVendettaTarget(rival, state) : undefined;

    const crownTarget = rival.agentMemory?.crownAssessment;
    return {
      intent,
      planWeeksRemaining: duration,
      targetStableId,
      targetArenaId: intent === 'CROWN_CAMPAIGN' ? crownTarget?.arenaId : undefined,
      reason: holdCourse
        ? `Holding course — ${INTENT_REASONS[intent].toLowerCase()}`
        : intent === 'CROWN_CAMPAIGN' && crownTarget
          ? `${INTENT_REASONS[intent]} — ${crownTarget.reason}.`
          : INTENT_REASONS[intent],
    };
  }

  // Otherwise, tick the current strategy
  return {
    ...current,
    planWeeksRemaining: current.planWeeksRemaining - 1,
  };
}
