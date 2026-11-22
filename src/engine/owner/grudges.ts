import type { GameState, OwnerGrudge, FightSummary } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { getRecentFights } from '@/engine/core/historyUtils';
import { PERSONALITY_CLASH } from '@/data/ownerData';
import { addCapped } from '@/utils/math';
import { calculateRivalryScore } from '@/engine/rivals/rivalUtils';
import { arenaIsHonorBound, HONOR_DOWN_CHALLENGE_MARGIN } from '@/engine/politics/honorCulture';

/** Fight outcomes aggregated per rival-pair / rival-vs-player, single pass. */
interface FightAggregation {
  rivalPairAgg: Map<string, { hasCrossFight: boolean; hasKill: boolean; hasSlight: boolean }>;
  rivalKillVsPlayer: Set<number>;
  rivalUpsetVsPlayer: Set<number>;
  rivalSlightVsPlayer: Set<number>;
}

/**
 * Honor-culture slight: the winner out-recognised the loser by the
 * down-challenge margin inside an honor-bound venue — the loser's stable
 * was fed to a famous blade and its owner remembers. Uses the fame stamped
 * on the summary at bout time (works for dead/retired warriors).
 */
function isHonorSlight(f: FightSummary): boolean {
  if (!f.winner || !arenaIsHonorBound(f.arenaId)) return false;
  const fameW = f.winner === 'A' ? (f.fameA ?? 0) : (f.fameD ?? 0);
  const fameL = f.winner === 'A' ? (f.fameD ?? 0) : (f.fameA ?? 0);
  return fameW - fameL > HONOR_DOWN_CHALLENGE_MARGIN;
}

/** Kill/upset/slight buckets one rival×player fight can fill. */
interface PlayerFightSets {
  rivalKillVsPlayer: Set<number>;
  rivalUpsetVsPlayer: Set<number>;
  rivalSlightVsPlayer: Set<number>;
}

/** Attribute one rival×player fight to its kill/upset/slight buckets. */
function aggregatePlayerCrossFight(
  f: FightSummary,
  ctx: { rivalIdx: number; rivalIsA: boolean; state: GameState; slight: boolean },
  sets: PlayerFightSets
): void {
  const { rivalIdx, rivalIsA, state, slight } = ctx;
  if (f.by === 'Kill') {
    sets.rivalKillVsPlayer.add(rivalIdx);
    return;
  }

  // Upset: the rival's warrior beat a much more famous player warrior.
  const rivalWon = (f.winner === 'A' && rivalIsA) || (f.winner === 'D' && !rivalIsA);
  if (rivalWon) {
    const loserId = rivalIsA ? f.warriorIdD : f.warriorIdA;
    const winnerId = rivalIsA ? f.warriorIdA : f.warriorIdD;
    const loserFame = state.warriorMap?.get(loserId)?.fame ?? 0;
    const winnerFame = state.warriorMap?.get(winnerId)?.fame ?? 0;
    if (loserFame - winnerFame >= 100) sets.rivalUpsetVsPlayer.add(rivalIdx);
  }

  // Honor slight: the player's famous blade beat the rival's lesser name
  // in an honor-bound venue — the slighted stable's grudge runs deeper.
  const playerWon = (f.winner === 'A' && !rivalIsA) || (f.winner === 'D' && rivalIsA);
  if (playerWon && slight) sets.rivalSlightVsPlayer.add(rivalIdx);
}

/**
 * Resolve each fight's warriors to their owning roster once, instead of
 * re-scanning all recentFights for every rival pair (O(R²·F)) and again for
 * every rival×player pair (O(R·F)).
 */
function aggregateRecentFights(state: GameState, rivals: GameState['rivals']): FightAggregation {
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);

  const warriorToRival = new Map<WarriorId, number>();
  const rivalIdxByStableId = new Map<string, number>();
  rivals.forEach((r, idx) => {
    rivalIdxByStableId.set(r.id as string, idx);
    for (const w of r.roster) {
      if (!warriorToRival.has(w.id)) warriorToRival.set(w.id, idx);
    }
  });
  // Kill victims leave their roster before this pass (mortalityHandler removes
  // them), so attribute dead warriors through the stableId kept on their
  // graveyard snapshot — otherwise every kill reads as a missing participant.
  for (const w of state.graveyard ?? []) {
    if (warriorToRival.has(w.id)) continue;
    const idx = w.stableId ? rivalIdxByStableId.get(w.stableId as string) : undefined;
    if (idx !== undefined) warriorToRival.set(w.id, idx);
  }
  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));
  const playerStableId = state.player?.id as string | undefined;
  for (const w of state.graveyard ?? []) {
    if (w.stableId === playerStableId) playerWarriorIds.add(w.id);
  }

  const pairKey = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`);
  const rivalPairAgg = new Map<
    string,
    { hasCrossFight: boolean; hasKill: boolean; hasSlight: boolean }
  >();
  const rivalKillVsPlayer = new Set<number>();
  const rivalUpsetVsPlayer = new Set<number>();
  const rivalSlightVsPlayer = new Set<number>();

  for (const f of recentFights) {
    if (!f) continue;
    const idxA = warriorToRival.get(f.warriorIdA);
    const idxD = warriorToRival.get(f.warriorIdD);
    const slight = isHonorSlight(f);

    if (idxA !== undefined && idxD !== undefined) {
      if (idxA === idxD) continue; // intra-stable bout is never a cross-fight
      const key = pairKey(idxA, idxD);
      const agg = rivalPairAgg.get(key) ?? {
        hasCrossFight: false,
        hasKill: false,
        hasSlight: false,
      };
      agg.hasCrossFight = true;
      if (f.by === 'Kill') agg.hasKill = true;
      if (slight) agg.hasSlight = true;
      rivalPairAgg.set(key, agg);
      continue;
    }

    // Player cross-fight: exactly one side is a current rival warrior and the
    // other a current player-roster warrior.
    const rivalIdx = idxA !== undefined ? idxA : idxD;
    if (rivalIdx === undefined) continue;
    const rivalIsA = idxA !== undefined;
    const otherIsPlayer = rivalIsA
      ? playerWarriorIds.has(f.warriorIdD)
      : playerWarriorIds.has(f.warriorIdA);
    if (!otherIsPlayer) continue;

    aggregatePlayerCrossFight(
      f,
      { rivalIdx, rivalIsA, state, slight },
      { rivalKillVsPlayer, rivalUpsetVsPlayer, rivalSlightVsPlayer }
    );
  }

  return { rivalPairAgg, rivalKillVsPlayer, rivalUpsetVsPlayer, rivalSlightVsPlayer };
}

// Order-independent owner-pair lookup replaces the per-pair `grudges.find`
// scan (was O(R²·G)).
const ownerPairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const rivalIdxKey = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`);

interface ProcessRivalPairsArgs {
  state: GameState;
  rivals: GameState['rivals'];
  agg: FightAggregation;
  grudges: OwnerGrudge[];
  grudgeByPair: Map<string, OwnerGrudge>;
  gazetteItems: string[];
}

/** Rival×rival pairs: personality clashes escalate into grudges on kills
 *  and honor-venue slights. */
function processRivalPairs(args: ProcessRivalPairsArgs): void {
  const { state, rivals, agg, grudges, grudgeByPair } = args;
  const { gazetteItems } = args;
  for (let i = 0; i < rivals.length; i++) {
    const rA = rivals[i];
    if (!rA) continue;
    for (let j = i + 1; j < rivals.length; j++) {
      const rB = rivals[j];
      if (!rB) continue;
      const persA = rA.owner.personality;
      const persB = rB.owner.personality;
      if (!persA || !persB) continue;

      // Check if personalities naturally clash
      const clash =
        PERSONALITY_CLASH[persA]?.includes(persB) || PERSONALITY_CLASH[persB]?.includes(persA);
      if (!clash) continue;

      const pairAgg = agg.rivalPairAgg.get(rivalIdxKey(i, j));
      if (!pairAgg?.hasCrossFight) continue;
      const hasKill = pairAgg.hasKill;
      const hasSlight = pairAgg.hasSlight;

      const existing = grudgeByPair.get(ownerPairKey(rA.owner.id, rB.owner.id));

      if (existing) {
        if ((hasKill || hasSlight) && existing.lastEscalation < state.week - 4) {
          const prevIntensity = existing.intensity;
          existing.intensity = addCapped(existing.intensity, 1, 5);
          existing.lastEscalation = state.week;
          existing.reason = hasKill
            ? `Blood spilled between ${rA.owner.stableName} and ${rB.owner.stableName}`
            : `Honor-venue slight between ${rA.owner.stableName} and ${rB.owner.stableName}`;
          gazetteItems.push(
            hasKill
              ? `🔥 GRUDGE DEEPENS: ${rA.owner.name} (${persA}) and ${rB.owner.name} (${persB}) — their feud intensifies after another kill!`
              : `🔥 GRUDGE DEEPENS: ${rA.owner.name} (${persA}) and ${rB.owner.name} (${persB}) — their feud intensifies after an honor-venue slight!`
          );
          if (prevIntensity < 4 && existing.intensity >= 4) {
            gazetteItems.push(
              `⚡ SEASON FEUD: The rivalry between ${rA.owner.stableName} and ${rB.owner.stableName} has become an all-consuming feud!`
            );
          }
        }
      } else if (hasKill || hasSlight) {
        const created: OwnerGrudge = {
          id: `grudge_${rA.owner.id}_${rB.owner.id}` as import('@/types/shared.types').GrudgeId,
          ownerIdA: rA.owner.id,
          ownerIdB: rB.owner.id,
          intensity: hasKill ? 2 : 1,
          reason: hasKill
            ? `Personality clash: ${persA} vs ${persB} — ignited by bloodshed`
            : `Personality clash: ${persA} vs ${persB} — stoked by an honor-venue slight`,
          startWeek: state.week,
          lastEscalation: state.week,
        };
        grudges.push(created);
        grudgeByPair.set(ownerPairKey(created.ownerIdA, created.ownerIdB), created);
        gazetteItems.push(
          hasKill
            ? `⚔️ NEW RIVALRY: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} have declared a blood feud!`
            : `🏛️ DISHONORED: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} feud over an honor-venue slight!`
        );
      }
    }
  }
}

interface ProcessPlayerPairsArgs {
  state: GameState;
  rivals: GameState['rivals'];
  agg: FightAggregation;
  playerWarriorCount: number;
  grudges: OwnerGrudge[];
  grudgeByPair: Map<string, OwnerGrudge>;
  gazetteItems: string[];
}

/**
 * Player × rival pairs: kills/upsets against the player's roster and
 * honor-venue slights of rival warriors create real grudges. Unlike
 * rival×rival pairs these need no personality clash — bloodshed is reason
 * enough.
 */
function processPlayerPairs(args: ProcessPlayerPairsArgs): void {
  const { state, rivals, agg, playerWarriorCount, grudges } = args;
  const { grudgeByPair, gazetteItems } = args;
  if (playerWarriorCount === 0) return;

  for (let idx = 0; idx < rivals.length; idx++) {
    const r = rivals[idx];
    if (!r) continue;
    const hasKill = agg.rivalKillVsPlayer.has(idx);
    const hasUpset = agg.rivalUpsetVsPlayer.has(idx);
    const hasSlight = agg.rivalSlightVsPlayer.has(idx);

    if (!hasKill && !hasUpset && !hasSlight) continue;

    const existing = grudgeByPair.get(ownerPairKey(r.owner.id, state.player.id));

    if (existing) {
      if ((hasKill || hasSlight) && existing.lastEscalation < state.week - 4) {
        existing.intensity = addCapped(existing.intensity, 1, 5);
        existing.lastEscalation = state.week;
        existing.reason = hasKill
          ? `Blood spilled between ${r.owner.stableName} and the player's stable`
          : `${r.owner.stableName} was slighted again by the player's stable in an honor venue`;
        gazetteItems.push(
          hasKill
            ? `🔥 GRUDGE DEEPENS: ${r.owner.name} vows vengeance on the player's stable after another kill!`
            : `🔥 GRUDGE DEEPENS: ${r.owner.name} seethes — the player's stable keeps picking on lesser names in honor venues!`
        );
      }
    } else {
      const created: OwnerGrudge = {
        id: `grudge_${r.owner.id}_${state.player.id}` as import('@/types/shared.types').GrudgeId,
        ownerIdA: r.owner.id,
        ownerIdB: state.player.id,
        intensity: hasKill ? 2 : 1,
        reason: hasKill
          ? `${r.owner.stableName} suffered a kill at the player's hands`
          : hasSlight
            ? `${r.owner.stableName} was slighted — the player's famous blade picked on their lesser name in an honor venue`
            : `${r.owner.stableName} was humiliated by an underdog defeat`,
        startWeek: state.week,
        lastEscalation: state.week,
      };
      grudges.push(created);
      grudgeByPair.set(ownerPairKey(created.ownerIdA, created.ownerIdB), created);
      gazetteItems.push(
        hasKill
          ? `⚔️ BLOOD FEUD: ${r.owner.name} has sworn vengeance on the player's stable!`
          : hasSlight
            ? `🏛️ DISHONORED: ${r.owner.name} seethes — the player's stable sent a famous blade against their lesser name in an honor-bound venue.`
            : `😤 SLIGHTED: ${r.owner.name} seethes after an upset loss to the player's stable.`
      );
    }
  }
}

/**
 * Detect and escalate owner-to-owner grudges based on personality clashes,
 * recent kill/loss history, and honor-venue slights between stables.
 */
export function processOwnerGrudges(
  state: GameState,
  existingGrudges: OwnerGrudge[]
): { grudges: OwnerGrudge[]; gazetteItems: string[] } {
  const grudges = existingGrudges.map((g) => ({ ...g }));
  const gazetteItems: string[] = [];
  const rivals = state.rivals || [];

  const agg = aggregateRecentFights(state, rivals);

  const grudgeByPair = new Map<string, OwnerGrudge>();
  for (const g of grudges) {
    const k = ownerPairKey(g.ownerIdA, g.ownerIdB);
    if (!grudgeByPair.has(k)) grudgeByPair.set(k, g);
  }

  processRivalPairs({
    state: state,
    rivals: rivals,
    agg: agg,
    grudges: grudges,
    grudgeByPair: grudgeByPair,
    gazetteItems: gazetteItems,
  });
  const deadPlayerCount = (state.graveyard ?? []).filter(
    (w) => w.stableId === state.player?.id
  ).length;
  processPlayerPairs({
    state: state,
    rivals: rivals,
    agg: agg,
    playerWarriorCount: (state.roster || []).length + deadPlayerCount,
    grudges: grudges,
    grudgeByPair: grudgeByPair,
    gazetteItems: gazetteItems,
  });

  // Decay old grudges — after 4 consecutive weeks with no cross-stable fight the
  // intensity drops by 1. This replaces the old 26-week cliff.
  for (const g of grudges) {
    if (state.week - g.lastEscalation > 4 && g.intensity > 1) {
      g.intensity = Math.max(1, g.intensity - 1);
    }
  }

  return { grudges: grudges.filter((g) => g.intensity > 0), gazetteItems };
}

export { calculateRivalryScore };
