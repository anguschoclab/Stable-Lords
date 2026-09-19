import type { GameState, RivalStableData, AIIntent, AIStrategy } from '@/types/state.types';
import { computeMetaDrift } from '../metaDrift';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService, resolveRng } from '@/utils/random';
import { computePlayerThreatLevel } from './agentCore';
import { hasInjuries } from '@/engine/injuries/utils';
import { isActive } from '@/engine/warriorStatus';
import { HAZARDOUS_WEATHER } from './weatherSuitability';

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
    if ((g.ownerIdA === ownerId || g.ownerIdB === ownerId) && g.intensity >= 3) {
      return g;
    }
  }
  return undefined;
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

  // Weather Pivot: Avoid the arena if the stable is precision-heavy and weather is hazardous
  const precisionHeavy = activeRoster.length === 0 || lungeCount / activeRoster.length >= 0.5;
  if (isHazardousWeather && precisionHeavy && personality !== 'Aggressive') {
    return 'RECOVERY';
  }

  // 1. RECOVERY: High priority if stable is in crisis or season is going badly
  const seasonRecord = rival.agentMemory?.seasonRecord;
  const seasonFightsPlayed = (seasonRecord?.wins ?? 0) + (seasonRecord?.losses ?? 0);
  const seasonWinRate =
    seasonFightsPlayed >= 6 ? (seasonRecord?.wins ?? 0) / seasonFightsPlayed : null;

  if (
    rival.treasury < 200 ||
    (activeRoster.length > 0 && injuryCount / activeRoster.length >= 0.4) ||
    (metaIsHostile && personality === 'Methodical') ||
    (seasonWinRate !== null && seasonWinRate < 0.3)
  ) {
    return 'RECOVERY';
  }

  // 2. VENDETTA: If there is a high-intensity grudge, or the player is dominant
  const hasGrudge = findGrudge(state.grudgeMap, rival.owner.id) !== undefined;

  const playerThreat = computePlayerThreatLevel(state);
  const playerThreatVendettaChance =
    playerThreat === 'Dominant' &&
    (personality === 'Aggressive' || personality === 'Showman' || personality === 'Tactician')
      ? 0.25
      : 0;

  const vendettaChance = personality === 'Aggressive' ? 0.4 : personality === 'Showman' ? 0.2 : 0.1;
  if (hasGrudge && rngService.next() < vendettaChance) {
    return 'VENDETTA';
  }
  if (playerThreatVendettaChance > 0 && rngService.next() < playerThreatVendettaChance) {
    return 'VENDETTA';
  }

  // 2.5. TOURNAMENT_CAMPAIGN: healthy stables peak for the season-ending
  // tournament (weeks 10–13). Preparation only — committee selection is
  // rank-based and unaffected (G13).
  const inTournamentWindow = state.week >= 10 && state.week <= 13;
  if (inTournamentWindow && activeRoster.length >= 3 && rival.treasury >= 400) {
    return 'TOURNAMENT_CAMPAIGN';
  }

  // 3. WEALTH_ACCUMULATION: Thriving stables with full rosters hoard cash
  if (
    rival.treasury > 1500 &&
    seasonWinRate !== null &&
    seasonWinRate >= 0.6 &&
    (personality === 'Methodical' || personality === 'Pragmatic')
  ) {
    return 'WEALTH_ACCUMULATION';
  }

  // 4. AGGRESSIVE_EXPANSION: Dominant Aggressive stables push for prestige bouts
  const maxRosterSize = personality === 'Aggressive' ? 10 : 8;
  if (
    activeRoster.length >= maxRosterSize &&
    rival.treasury > 1200 &&
    personality === 'Aggressive'
  ) {
    return 'AGGRESSIVE_EXPANSION';
  }

  // 5. ROSTER_DIVERSITY: Stables heavily concentrated in a meta-losing style diversify
  const allStyles = activeRoster.map((w) => w.style);
  if (allStyles.length >= 4) {
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
    if (dominantStyle && maxConcentration >= 0.5 && (meta[dominantStyle] ?? 0) <= -3) {
      return 'ROSTER_DIVERSITY';
    }
  }

  // 6. EXPANSION: If roster is thin — boosted if a known rival has grown recently
  const minSize = personality === 'Aggressive' ? 8 : personality === 'Methodical' ? 5 : 6;
  const knownRivals = rival.agentMemory?.knownRivals ?? [];
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalsByOwnerId = new Map<string, RivalStableData>();
  for (const rv of state.rivals || []) {
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
  if (activeRoster.length < expansionThreshold && rival.treasury > 300) {
    return 'EXPANSION';
  }

  // 7. CONSOLIDATION: Default (focus on training and base maintenance)
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

  // Skepticism Tier 1: Financial Crisis
  if (strategy.intent !== 'RECOVERY' && rival.treasury < 150) return true;

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
      return rival.treasury < 300;
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
      return (
        dominant !== undefined && max / styles.length >= 0.45 && (meta[dominant] ?? 0) <= -2
      );
    }
    case 'CONSOLIDATION':
      return true;
  }
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
      intent === 'RECOVERY' ? 2 : intent === 'VENDETTA' ? 6 : intent === 'EXPANSION' ? 3 : 4;

    let targetStableId = undefined;
    if (intent === 'VENDETTA') {
      const grudgeTarget = findGrudge(state.grudgeMap, rival.owner.id);
      if (grudgeTarget !== undefined) {
        targetStableId =
          grudgeTarget.ownerIdA === rival.owner.id ? grudgeTarget.ownerIdB : grudgeTarget.ownerIdA;
      }
      // No grudge target — fall back to dossier intel: whoever has beaten us
      // most (or threatens us most), else the player stable.
      if (!targetStableId) {
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
        targetStableId = (bestId ?? state.player?.id) as AIStrategy['targetStableId'];
      }
    }

    return {
      intent,
      planWeeksRemaining: duration,
      targetStableId,
      reason: holdCourse
        ? `Holding course — ${INTENT_REASONS[intent].toLowerCase()}`
        : INTENT_REASONS[intent],
    };
  }

  // Otherwise, tick the current strategy
  return {
    ...current,
    planWeeksRemaining: current.planWeeksRemaining - 1,
  };
}
