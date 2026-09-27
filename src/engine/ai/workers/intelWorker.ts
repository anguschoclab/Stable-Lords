/**
 * Intel worker — the rival's weekly scouting action.
 *
 * Each week the stable picks its most relevant opponent (vendetta target >
 * highest-threat dossier > upcoming title opponent > the player) and refreshes
 * that dossier's `planIntel`: suspected OE/AL bands with a freshness stamp.
 * Estimates are personality-based beliefs (aggressive owners plan high-OE),
 * narrowed by the scout's own personality — Tacticians and Methodicals read
 * opponents best — and by persisted dossier `observedTells` from witnessed
 * fights, which override the reputation prior.
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { PerceptionSnapshot } from '../memory/perceptionSnapshot';
import { logAgentAction } from '../agentCore';
import { hashStr } from '@/utils/random';
import { clamp } from '@/utils/math';

/** Scouting acuity by owner personality — tighter plan estimates. */
const SCOUT_QUALITY: Record<string, number> = {
  Tactician: 0.9,
  Methodical: 0.8,
  Pragmatic: 0.6,
  Showman: 0.5,
  Aggressive: 0.4,
};

/** Baseline plan tendencies attributed to an owner's personality. */
const PERSONALITY_PLAN_BIAS: Record<string, { oe: number; al: number }> = {
  Aggressive: { oe: 0.75, al: 0.35 },
  Showman: { oe: 0.65, al: 0.45 },
  Pragmatic: { oe: 0.5, al: 0.5 },
  Methodical: { oe: 0.4, al: 0.6 },
  Tactician: { oe: 0.45, al: 0.65 },
};

function estimatePlan(
  observerId: string,
  targetId: string,
  week: number,
  quality: number,
  bias: { oe: number; al: number }
): { suspectedOE: number; suspectedAL: number } {
  // Noise shrinks with scout quality; deterministic per observer/target/week.
  const spread = (1 - quality) * 0.4;
  const jitter = (salt: string) =>
    ((hashStr(`${observerId}|${targetId}|${week}|${salt}`) % 1000) / 1000 - 0.5) * 2 * spread;
  return {
    suspectedOE: Math.round(clamp(bias.oe + jitter('oe'), 0, 1) * 100) / 100,
    suspectedAL: Math.round(clamp(bias.al + jitter('al'), 0, 1) * 100) / 100,
  };
}

/** Persisted dossier tells stay actionable for this many weeks. */
const PLAN_TELL_WINDOW = 8;

/**
 * Pick the dossier most worth scouting: the vendetta target if there is one,
 * else the highest-threat observed stable, else the stable we meet in an
 * upcoming title bout, else the most famous rival, else the player.
 */
function pickScoutTarget(rival: RivalStableData, state: GameState): string | undefined {
  const vendettaTarget =
    rival.strategy?.intent === 'VENDETTA' ? rival.strategy.targetStableId : undefined;
  const dossiers = rival.agentMemory?.opponentDossiers ?? {};
  if (vendettaTarget && dossiers[vendettaTarget]) return vendettaTarget;

  let bestId: string | undefined;
  let bestThreat = -1;
  for (const [id, d] of Object.entries(dossiers)) {
    if (d.estimatedThreat > bestThreat) {
      bestThreat = d.estimatedThreat;
      bestId = id;
    }
  }
  if (bestId) return bestId;

  // Upcoming title opponent — a pending/signed title bout involving one of
  // our warriors makes the other side's stable the most relevant read.
  const selfIds = new Set(rival.roster.map((w) => w.id));
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer.titleArenaId) continue;
    if (offer.status !== 'Signed' && offer.status !== 'Proposed') continue;
    const mine = offer.warriorIds.find((id) => selfIds.has(id));
    if (!mine) continue;
    const otherId = offer.warriorIds.find((id) => id !== mine);
    if (!otherId) continue;
    const oppStable =
      state.warriorToStableMap?.get(otherId)?.stableId ??
      (state.roster?.some((w) => w.id === otherId) ? state.player.id : undefined);
    if (oppStable) return oppStable;
  }

  // Thin intel: no dossier has an edge — scout the most famous rival stable
  // (fame is the dossier's threat proxy) before defaulting to the player.
  let bestFame = -1;
  for (const r of state.rivals ?? []) {
    if (r.id === rival.id || r.owner.id === rival.owner.id) continue;
    const fame = r.owner.fame ?? 0;
    if (fame > bestFame) {
      bestFame = fame;
      bestId = r.id as string;
    }
  }
  if (bestId) return bestId;

  return vendettaTarget ?? (state.player.id !== rival.id ? state.player.id : undefined);
}

/**
 * Weekly scouting pass. Mutates nothing outside `rival.agentMemory`.
 * Returns the updated rival plus gazette items.
 */
export function processIntel(
  rival: RivalStableData,
  state: GameState,
  _perception?: PerceptionSnapshot
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const gazetteItems: string[] = [];
  const memory = rival.agentMemory;
  if (!memory?.opponentDossiers) return { updatedRival: rival, gazetteItems };
  const dossiers = memory.opponentDossiers;

  const week = state.absoluteWeek ?? state.week;
  const targetId = pickScoutTarget(rival, state);
  if (!targetId) return { updatedRival: rival, gazetteItems };

  const quality = SCOUT_QUALITY[rival.owner.personality ?? 'Pragmatic'] ?? 0.6;

  // Plan bias: from the target owner's personality when known (rival stables);
  // the player's plan is inferred from observed styles (neutral baseline).
  const targetRival = (state.rivals ?? []).find(
    (r) => r.id === targetId || r.owner.id === targetId
  );
  const bias =
    PERSONALITY_PLAN_BIAS[targetRival?.owner.personality ?? ''] ?? { oe: 0.5, al: 0.5 };

  // Observed tells override the prior: dossier tells persisted from fights
  // this stable actually witnessed outweigh the owner's reputation — a good
  // scout weighs what they saw over what they'd expect.
  const tells = dossiers[targetId]?.observedTells;
  const observed =
    tells && tells.samples > 0 && week - tells.lastSeenWeek <= PLAN_TELL_WINDOW
      ? { oe: tells.oe, al: tells.al }
      : undefined;
  const effectiveBias = observed
    ? {
        oe: bias.oe * (1 - quality) + observed.oe * quality,
        al: bias.al * (1 - quality) + observed.al * quality,
      }
    : bias;

  const estimate = estimatePlan(rival.owner.id, targetId, week, quality, effectiveBias);

  const prior = dossiers[targetId] ?? {
    lastSeenWeek: week,
    knownStyles: [],
    estimatedThreat: 0.5,
    recordVs: { w: 0, l: 0, k: 0 },
  };

  const updatedDossiers = {
    ...dossiers,
    [targetId]: {
      ...prior,
      planIntel: {
        suspectedOE: estimate.suspectedOE,
        suspectedAL: estimate.suspectedAL,
        lastPlanWeek: week,
      },
    },
  };

  let updatedRival: RivalStableData = {
    ...rival,
    agentMemory: {
      ...memory,
      opponentDossiers: updatedDossiers,
    },
  };

  const targetName =
    targetId === state.player.id
      ? 'the player stable'
      : (targetRival?.owner.stableName ?? 'an unknown stable');
  updatedRival = logAgentAction(
    updatedRival,
    'INTEL',
    `Scouted ${targetName}: suspected OE ${estimate.suspectedOE}, AL ${estimate.suspectedAL}.`,
    'Low',
    state.week,
    'INTEL_UPDATE'
  );

  return { updatedRival, gazetteItems };
}
