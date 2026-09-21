/**
 * Intel worker — the rival's weekly scouting action.
 *
 * Each week the stable picks its most relevant opponent (vendetta target >
 * highest-threat dossier > the player) and refreshes that dossier's
 * `planIntel`: suspected OE/AL bands with a freshness stamp. Estimates are
 * personality-based beliefs (aggressive owners plan high-OE), narrowed by the
 * scout's own personality — Tacticians and Methodicals read opponents best.
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

/**
 * Pick the dossier most worth scouting: the vendetta target if there is one,
 * else the highest-threat observed stable, else the player.
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

  const estimate = estimatePlan(rival.owner.id, targetId, week, quality, bias);

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
