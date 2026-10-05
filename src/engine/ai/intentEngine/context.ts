import type { GameState, RivalStableData } from '@/types/state.types';
import { computeMetaDrift } from '../../analytics/metaDrift';
import { hasInjuries } from '@/engine/injuries/utils';
import { isActive } from '@/engine/warrior/warriorStatus';
import { HAZARDOUS_WEATHER } from '../weatherSuitability';

/**
 * Finds a high-intensity grudge (>= 3) involving the given owner.
 * Uses fast iterator search with early break — no intermediate array allocation.
 */
export function findGrudge(
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
export interface IntentContext {
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

/** Computes the per-pick fact bundle every intent predicate reasons over. */
export function buildIntentContext(rival: RivalStableData, state: GameState): IntentContext {
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
