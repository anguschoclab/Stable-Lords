import type { GameState, RivalStableData, AIIntent, AIStrategy } from '@/types/state.types';
import { computeMetaDrift } from '../../analytics/metaDrift';
import { hasInjuries } from '@/engine/injuries/utils';
import { isActive } from '@/engine/warrior/warriorStatus';
import { HAZARDOUS_WEATHER } from '../weatherSuitability';
import { objectiveStillViable } from '../plan/seasonPlan';
import { projectedWeeklyUpkeep } from '../workers/budgetWorker';
import { findGrudge } from './context';

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
export function crownCampaignApplies(rival: RivalStableData, state: GameState): boolean {
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
export const INTENT_REASONS: Record<AIIntent, string> = {
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
export function resolveVendettaTarget(
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
