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
import type {
  GameState,
  OpponentDossier,
  RivalStableData,
  ScoutReportData,
  Warrior,
} from '@/types/state.types';
import type { PerceptionSnapshot } from '../memory/perceptionSnapshot';
import { logAgentAction } from '../agentCore';
import { hashStr, SeededRNG } from '@/utils/random';
import { clamp } from '@/utils/math';
import { blendQuality } from '../competence';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { keySet } from '@/utils/collections';
import {
  generateScoutReport,
  matchesScoutTarget,
  type ScoutQuality,
} from '@/engine/scouting/scouting';
import { AI_SCOUT_REPORT_CAP } from '@/constants/ai';

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
  const playerIds = keySet(state.roster, (w) => w.id);
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer.titleArenaId) continue;
    if (offer.status !== 'Signed' && offer.status !== 'Proposed') continue;
    const mine = offer.warriorIds.find((id) => selfIds.has(id));
    if (!mine) continue;
    const otherId = offer.warriorIds.find((id) => id !== mine);
    if (!otherId) continue;
    const oppStable =
      state.warriorToStableMap?.get(otherId)?.stableId ??
      (playerIds.has(otherId) ? state.player.id : undefined);
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
 * Plan bias prior from the target owner's personality, blended with observed
 * tells when recent enough — a good scout weighs what they saw over the
 * owner's reputation.
 */
function effectivePlanBias(
  targetRival: RivalStableData | undefined,
  tells: { oe: number; al: number; samples: number; lastSeenWeek: number } | undefined,
  week: number,
  quality: number
): { oe: number; al: number } {
  const bias = PERSONALITY_PLAN_BIAS[targetRival?.owner.personality ?? ''] ?? { oe: 0.5, al: 0.5 };
  const observed =
    tells && tells.samples > 0 && week - tells.lastSeenWeek <= PLAN_TELL_WINDOW
      ? { oe: tells.oe, al: tells.al }
      : undefined;
  if (!observed) return bias;
  return {
    oe: bias.oe * (1 - quality) + observed.oe * quality,
    al: bias.al * (1 - quality) + observed.al * quality,
  };
}

/** Blended scout acuity → player-facing scout quality tier. */
function toScoutQuality(quality: number): ScoutQuality {
  if (quality >= 0.75) return 'Expert';
  if (quality >= 0.55) return 'Detailed';
  return 'Basic';
}

/** OE/AL report bands → normalized planIntel values. */
const PLAN_BAND_VALUE: Record<string, number> = { High: 0.75, Medium: 0.5, Low: 0.25 };

/**
 * Which warrior on the scouted stable the report covers: the warrior we'll
 * actually fight (a signed/proposed title bout) if one exists, else the
 * stable's most accomplished active warrior — deterministic tiebreak on id.
 */
function pickReportWarrior(
  rival: RivalStableData,
  targetId: string,
  targetRival: RivalStableData | undefined,
  state: GameState
): Warrior | undefined {
  const selfIds = new Set(rival.roster.map((w) => w.id));
  const playerIds = keySet(state.roster, (w) => w.id);
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer.titleArenaId) continue;
    if (offer.status !== 'Signed' && offer.status !== 'Proposed') continue;
    const mine = offer.warriorIds.find((id) => selfIds.has(id));
    if (!mine) continue;
    const otherId = offer.warriorIds.find((id) => id !== mine);
    if (!otherId) continue;
    const oppStable =
      state.warriorToStableMap?.get(otherId)?.stableId ??
      (playerIds.has(otherId) ? state.player.id : undefined);
    if (oppStable === targetId) return findWarriorById(state, otherId);
  }

  const pool = (targetId === state.player.id ? state.roster : targetRival?.roster) ?? [];
  const active = pool.filter((w) => w.status !== 'Dead' && w.status !== 'Retired');
  if (active.length === 0) return undefined;
  return [...active].sort(
    (a, b) =>
      b.career.wins - a.career.wins ||
      (b.fame ?? 0) - (a.fame ?? 0) ||
      String(a.id).localeCompare(String(b.id))
  )[0];
}

/** One scout report's inputs — grouped to stay inside the param budget. */
interface ScoutReportArgs {
  rival: RivalStableData;
  reportWarrior: Warrior;
  targetRival: RivalStableData | undefined;
  week: number;
  quality: number;
  memory: RivalStableData['agentMemory'];
  dossier: OpponentDossier;
  estimate: { suspectedOE: number; suspectedAL: number };
}

/**
 * File a ScoutReportData for `reportWarrior` through the same machinery the
 * player's scouting page uses, then fold it back into the dossier: Expert
 * OE/AL bands override the reputation estimate (unless the target masks),
 * the warrior's style joins knownStyles, and any competence read lands on
 * the dossier. Returns the capped report list plus the updated dossier.
 */
function fileScoutReport(args: ScoutReportArgs): {
  scoutReports: ScoutReportData[];
  dossier: OpponentDossier;
} {
  const { rival, reportWarrior, targetRival, week, quality, memory, dossier, estimate } = args;
  const reportRng = new SeededRNG(hashStr(`scout|${rival.id}|${week}|${reportWarrior.id}`));
  const { report } = generateScoutReport(
    reportWarrior,
    toScoutQuality(quality),
    week,
    reportRng,
    targetRival?.owner
  );
  const scoutReports = [
    ...(memory?.scoutReports ?? []).filter((r) => !matchesScoutTarget(r, reportWarrior)),
    report,
  ].slice(-AI_SCOUT_REPORT_CAP);

  const next: OpponentDossier = { ...dossier };
  if (!report.possiblyMaskedPlan && report.suspectedOE) {
    // Only Expert reports carry OE/AL bands — they are the scout's real
    // read on the committed plan and beat the reputation estimate.
    next.planIntel = {
      suspectedOE: PLAN_BAND_VALUE[report.suspectedOE] ?? estimate.suspectedOE,
      suspectedAL: PLAN_BAND_VALUE[report.suspectedAL ?? ''] ?? estimate.suspectedAL,
      lastPlanWeek: week,
    };
  }
  if (!next.knownStyles.includes(reportWarrior.style)) {
    next.knownStyles = [...next.knownStyles, reportWarrior.style];
  }
  if (report.suspectedCompetence) {
    next.suspectedCompetence = report.suspectedCompetence;
  }
  return { scoutReports, dossier: next };
}

/** Dossier refresh inputs — grouped to stay inside the param budget. */
interface DossierRefreshArgs {
  rival: RivalStableData;
  targetId: string;
  targetRival: RivalStableData | undefined;
  state: GameState;
  week: number;
  quality: number;
  memory: NonNullable<RivalStableData['agentMemory']>;
}

/**
 * Refresh the target dossier: reputation planIntel estimate plus, when a
 * reportable warrior exists on the scouted stable, a filed scout report
 * folded back through fileScoutReport.
 */
function refreshDossier(args: DossierRefreshArgs): {
  dossier: OpponentDossier;
  scoutReports: ScoutReportData[] | undefined;
} {
  const { rival, targetId, targetRival, state, week, quality, memory } = args;
  const dossiers = memory.opponentDossiers;
  const effectiveBias = effectivePlanBias(
    targetRival,
    dossiers[targetId]?.observedTells,
    week,
    quality
  );
  const estimate = estimatePlan(rival.owner.id, targetId, week, quality, effectiveBias);

  const prior = dossiers[targetId] ?? {
    lastSeenWeek: week,
    knownStyles: [],
    estimatedThreat: 0.5,
    recordVs: { w: 0, l: 0, k: 0 },
  };

  let dossier: OpponentDossier = {
    ...prior,
    planIntel: {
      suspectedOE: estimate.suspectedOE,
      suspectedAL: estimate.suspectedAL,
      lastPlanWeek: week,
    },
  };

  const reportWarrior = pickReportWarrior(rival, targetId, targetRival, state);
  if (!reportWarrior) return { dossier, scoutReports: memory.scoutReports };

  const filed = fileScoutReport({
    rival,
    reportWarrior,
    targetRival,
    week,
    quality,
    memory,
    dossier,
    estimate,
  });
  dossier = filed.dossier;
  return { dossier, scoutReports: filed.scoutReports };
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

  const week = state.absoluteWeek ?? state.week;
  const targetId = pickScoutTarget(rival, state);
  if (!targetId) return { updatedRival: rival, gazetteItems };

  const quality = blendQuality(
    SCOUT_QUALITY[rival.owner.personality ?? 'Pragmatic'] ?? 0.6,
    rival.owner
  );
  const targetRival = (state.rivals ?? []).find(
    (r) => r.id === targetId || r.owner.id === targetId
  );

  const refreshed = refreshDossier({
    rival,
    targetId,
    targetRival,
    state,
    week,
    quality,
    memory,
  });

  let updatedRival: RivalStableData = {
    ...rival,
    agentMemory: {
      ...memory,
      opponentDossiers: { ...memory.opponentDossiers, [targetId]: refreshed.dossier },
      scoutReports: refreshed.scoutReports,
    },
  };

  const targetName =
    targetId === state.player.id
      ? 'the player stable'
      : (targetRival?.owner.stableName ?? 'an unknown stable');
  const intel = refreshed.dossier.planIntel;
  updatedRival = logAgentAction({
    rival: updatedRival,
    type: 'INTEL',
    description: `Scouted ${targetName}: suspected OE ${intel?.suspectedOE}, AL ${intel?.suspectedAL}.`,
    riskTier: 'Low',
    week: state.week,
    cause: 'INTEL_UPDATE',
  });

  return { updatedRival, gazetteItems };
}
