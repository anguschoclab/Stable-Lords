/**
 * Intel dossier — what a rival stable believes about every other stable.
 *
 * Observed facts (recordVs, knownStyles, lastSeenWeek) are written from real
 * arena outcomes and never decay. Inferred beliefs (estimatedThreat) are
 * fame-based heuristics with deterministic jitter that regress toward an
 * uncertainty prior as the observation stales.
 */
import type {
  GameState,
  RivalStableData,
  OpponentDossier,
  FightSummary,
} from '@/types/state.types';
import type { FightingStyle, StableId } from '@/types/shared.types';
import { hashStr } from '@/utils/random';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { clamp } from '@/utils/math';

/** Max dossiers retained per stable — keeps memory bounded over long sims. */
export const DOSSIER_CAP = 12;
/** Threat prior: what an unobserved stable is assumed to be. */
const THREAT_PRIOR = 0.5;
/** Weekly decay factor applied to (threat - prior) per stale week. */
const DECAY = 0.9;
const MAX_KNOWN_STYLES = 6;

/**
 * Current rival owner ids excluding self. Existing consumers (intentEngine)
 * index knownRivals by owner.id — keep that identifier stable.
 */
export function refreshKnownRivals(rival: RivalStableData, state: GameState): StableId[] {
  return (state.rivals ?? [])
    .filter((r) => r.owner.id !== rival.owner.id)
    .map((r) => r.owner.id);
}

/**
 * Deterministic fame-based threat estimate with per-stable jitter so two
 * observers rate the same stable slightly differently (but reproducibly).
 */
function estimateThreat(stableId: string, fame: number, week: number): number {
  const base = clamp(fame / 500, 0, 1);
  const jitter = ((hashStr(`${stableId}|threat|${week}`) % 1000) / 1000) * 0.2 - 0.1;
  return clamp(base + jitter, 0, 1);
}

const blankDossier = (week: number): OpponentDossier => ({
  lastSeenWeek: week,
  knownStyles: [],
  estimatedThreat: THREAT_PRIOR,
  recordVs: { w: 0, l: 0, k: 0 },
});

function observeStyle(dossier: OpponentDossier, style: string): void {
  if (
    style &&
    !dossier.knownStyles.includes(style as FightingStyle) &&
    dossier.knownStyles.length < MAX_KNOWN_STYLES
  ) {
    dossier.knownStyles.push(style as FightingStyle);
  }
}

/**
 * Regress inferred beliefs toward the uncertainty prior with staleness.
 * Observed facts (recordVs, knownStyles) are untouched.
 */
export function decayDossiers(
  dossiers: Record<string, OpponentDossier>,
  currentWeek: number
): Record<string, OpponentDossier> {
  const out: Record<string, OpponentDossier> = {};
  for (const [id, d] of Object.entries(dossiers)) {
    const stale = Math.max(0, currentWeek - d.lastSeenWeek);
    out[id] =
      stale === 0
        ? d
        : {
            ...d,
            estimatedThreat:
              THREAT_PRIOR + (d.estimatedThreat - THREAT_PRIOR) * Math.pow(DECAY, stale),
          };
  }
  return out;
}

/** Keep the top-K most threatening/recent dossiers. Deterministic ordering. */
function pruneDossiers(
  dossiers: Record<string, OpponentDossier>
): Record<string, OpponentDossier> {
  const entries = Object.entries(dossiers);
  if (entries.length <= DOSSIER_CAP) return dossiers;
  entries.sort(
    (a, b) =>
      b[1].estimatedThreat - a[1].estimatedThreat ||
      b[1].lastSeenWeek - a[1].lastSeenWeek ||
      a[0].localeCompare(b[0])
  );
  return Object.fromEntries(entries.slice(0, DOSSIER_CAP));
}

/**
 * Refresh a stable's opponent dossiers from current world state:
 * 1. stale-week decay on prior beliefs,
 * 2. observe every extant stable (incl. the player) — decayed fame estimate,
 * 3. fold this week's fights into recordVs / knownStyles / lastSeenWeek,
 * 4. prune to DOSSIER_CAP.
 */
export function updateDossiers(
  rival: RivalStableData,
  state: GameState,
  weekFights?: FightSummary[]
): Record<string, OpponentDossier> {
  const week = state.absoluteWeek ?? state.week;
  const dossiers: Record<string, OpponentDossier> = decayDossiers(
    rival.agentMemory?.opponentDossiers ?? {},
    week
  );

  // Observe every extant stable — fame is public information, threat is inferred.
  for (const other of state.rivals ?? []) {
    if (other.id === rival.id) continue;
    const d = dossiers[other.id] ?? (dossiers[other.id] = blankDossier(week));
    d.lastSeenWeek = week;
    d.estimatedThreat = estimateThreat(other.id, other.fame ?? other.owner.fame ?? 0, week);
  }
  const playerId = state.player.id;
  if (playerId !== rival.id) {
    const d = dossiers[playerId] ?? (dossiers[playerId] = blankDossier(week));
    d.lastSeenWeek = week;
    d.estimatedThreat = estimateThreat(playerId, state.fame ?? 0, week);
  }

  // Fold this week's fights into observed facts (snapshot-precomputed when
  // available so all rivals share one arenaHistory scan per tick).
  const fights = weekFights ?? getFightsForWeek(state.arenaHistory ?? [], week);
  const selfIds = new Set(rival.roster.map((w) => w.id));
  const stableOf = (wid: FightSummary['warriorIdA']): string | undefined => {
    if (selfIds.has(wid)) return rival.id;
    return state.warriorToStableMap?.get(wid)?.stableId;
  };

  for (const fight of fights) {
    const stableA = stableOf(fight.warriorIdA);
    const stableD = stableOf(fight.warriorIdD);
    if (stableA && stableA !== rival.id) {
      const d = dossiers[stableA] ?? (dossiers[stableA] = blankDossier(week));
      d.lastSeenWeek = week;
      observeStyle(d, fight.styleA);
    }
    if (stableD && stableD !== rival.id) {
      const d = dossiers[stableD] ?? (dossiers[stableD] = blankDossier(week));
      d.lastSeenWeek = week;
      observeStyle(d, fight.styleD);
    }

    // recordVs only moves when THIS stable fought.
    const selfSide = selfIds.has(fight.warriorIdA)
      ? 'A'
      : selfIds.has(fight.warriorIdD)
        ? 'D'
        : null;
    if (!selfSide || !fight.winner) continue;
    const oppId = selfSide === 'A' ? stableD : stableA;
    if (!oppId || oppId === rival.id) continue;
    const d = dossiers[oppId] ?? (dossiers[oppId] = blankDossier(week));
    d.lastSeenWeek = week;
    if (fight.winner === selfSide) {
      d.recordVs.w++;
      if (fight.by === 'Kill') d.recordVs.k++;
    } else {
      d.recordVs.l++;
    }
  }

  return pruneDossiers(dossiers);
}
