/**
 * CrownWorker — rival-stale championship posture.
 *
 * Owns everything a stable thinks about *crowns* (distinct from ordinary
 * matchmaking):
 *  - `assessCrownOpportunity` — pick the best (warrior, arena) title campaign
 *    and persist it into agent memory, where the intent engine reads it one
 *    tick later (memory is allowed to lag like all other perception).
 *  - Reign management — aging/declining champions mark `pendingRelinquish`
 *    for the championship pass to execute through its real reign delta;
 *    the worker only declares intent, it never mutates `arenaChampions`.
 *  - Protection — warriors already signed for a title bout and reigning
 *    champions inside the Grand Championship prep window rest (recovery
 *    assignments suppress training and downstream bookings).
 */
import type {
  GameState,
  RivalStableData,
  CrownAssessment,
  AIAgentMemory,
  TrainingAssignment,
  Warrior,
} from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';
import { isActive } from '@/engine/warrior/warriorStatus';
import { isReigningChampion, buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { evaluateCampaignFocus } from '@/engine/advisor/campaignFocusEvaluator';
import { weeksUntilChampionsTournament, boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { logAgentAction, computePlayerThreatLevel } from '../agentCore';
import { competenceJitter } from '../competence';
import type { PerceptionSnapshot } from '../memory/perceptionSnapshot';
import type { ArenaTitle } from '@/types/state/championship';
import { warriorDisplayName } from '@/utils/warriorDisplay';

/** Weeks before the Grand Championship bracket in which champions rest. */
const GRAND_CHAMP_PREP_WEEKS = 2;
/** Champions older than this consider vacating when the reign is fading. */
const RELINQUISH_AGE = 30;
/** Cap on simultaneous crown campaigns per stable. */
const CAMPAIGN_SCORE_FLOOR = 2;
/** Campaign-score bonus for targeting the dominant player's throne —
 *  dethroning the realm's top stable outweighs an easier rival crown. */
const DETHRONE_BONUS = { Dominant: 3, Moderate: 1 } as const;
/** Score discount when the champion's stable has been witnessed fighting
 *  high-OE — a brawling throne is a bloodier climb. Needs >= 2 sightings to
 *  count as evidence, and Aggressive stables don't flinch. */
const OBSERVED_TELLS_MIN_SAMPLES = 2;
const OBSERVED_TELLS_HOT_OE = 0.7;
const OBSERVED_TELLS_PENALTY = 1;

interface CrownCandidate {
  warrior: Warrior;
  arenaId: string;
  score: number;
  reason: string;
}

/** Warriors signed for an upcoming title bout — they rest until it resolves. */
function signedTitleBoutIds(state: GameState): Set<string> {
  const ids = new Set<string>();
  const now = state.absoluteWeek ?? state.week;
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer.titleArenaId || offer.status !== 'Signed') continue;
    if (boutOfferAbsoluteWeek(offer) < now) continue;
    for (const wId of offer.warriorIds) ids.add(wId as string);
  }
  return ids;
}

/** Champion's venue win rate at an arena, or 0 when unknown. */
function venueWinRate(warrior: Warrior | undefined, arenaId: string): number {
  const rec = warrior?.career?.byArena?.[arenaId];
  if (!rec) return 0;
  const total = (rec.wins ?? 0) + (rec.losses ?? 0);
  return total > 0 ? (rec.wins ?? 0) / total : 0;
}

/**
 * Pick the stable's best title campaign: the (warrior, arena) pair where an
 * active non-champion is eligible — or one bout short of eligible — and the
 * throne is most winnable (vacant > dormant > weak champion > strong one).
 * Returns undefined when the stable has no credible crown path.
 */
/**
 * Score one (warrior, arena) throne bid — vacant > fading > winnable > climb,
 * plus dethrone pressure on a dominant player's crown and the witnessed-tells
 * penalty when the holder's camp is known to brawl.
 */
function scoreThrone(
  w: Warrior,
  arenaId: string,
  title: ArenaTitle,
  ctx: {
    eligible: boolean;
    rankBonus: number;
    champion: Warrior | undefined;
    dethroneBonus: number;
    playerWarriorIds: Set<WarriorId>;
    rival: RivalStableData;
    state: GameState;
  }
): { score: number; reason: string } {
  let score = ctx.eligible ? 2 : 1;
  let reason: string;
  if (!title.champion) {
    score += 2;
    reason = `Vacant crown at ${arenaId}`;
  } else if (title.status !== 'active') {
    score += 1;
    reason = `Fading reign at ${arenaId}`;
  } else {
    const champRate = venueWinRate(ctx.champion, arenaId);
    const ownRate = venueWinRate(w, arenaId);
    if (ownRate > champRate) {
      score += 2;
      reason = `Winnable throne at ${arenaId}`;
    } else {
      reason = `Crown climb at ${arenaId}`;
    }
    if (ctx.dethroneBonus > 0 && ctx.playerWarriorIds.has(ctx.champion?.id ?? ('' as WarriorId))) {
      score += ctx.dethroneBonus;
      reason = `Dethrone bid at ${arenaId} — the dominant player's crown is the prize`;
    }
    // Witnessed-tells danger: a dossier that saw the champion's stable
    // brawl high-OE marks this throne as a bloodier climb.
    if (ctx.champion && ctx.rival.owner.personality !== 'Aggressive') {
      const champStableId = ctx.state.warriorToStableMap?.get(ctx.champion.id)?.stableId;
      const tells = champStableId
        ? ctx.rival.agentMemory?.opponentDossiers?.[champStableId]?.observedTells
        : undefined;
      if (
        tells &&
        tells.samples >= OBSERVED_TELLS_MIN_SAMPLES &&
        tells.oe >= OBSERVED_TELLS_HOT_OE
      ) {
        score -= OBSERVED_TELLS_PENALTY;
        reason = `Bloody throne at ${arenaId} — the holder's camp brawls`;
      }
    }
  }
  // Competence noise — a Novice reads the throne map noisily and occasionally
  // campaigns for the wrong arena; a Master nearly always spots the softest
  // crown (Stage B). Deterministic per (owner, warrior, arena).
  const jitter = competenceJitter(ctx.rival.owner, `crown|${w.id}|${arenaId}`, 2);
  return { score: score + ctx.rankBonus + jitter, reason };
}

/** Scores the rival's best crown-bid opportunity across arenas. */
export function assessCrownOpportunity(
  rival: RivalStableData,
  state: GameState,
  perception?: PerceptionSnapshot
): CrownAssessment | undefined {
  const titles = state.arenaChampions ?? {};
  if (Object.keys(titles).length === 0) return undefined;

  const now = state.absoluteWeek ?? state.week;
  const signed = signedTitleBoutIds(state);
  const warriorById = new Map<WarriorId, Warrior>();
  for (const w of state.roster ?? []) warriorById.set(w.id, w);
  for (const r of state.rivals ?? []) for (const w of r.roster) warriorById.set(w.id, w);

  // Dominant-player pressure: when the player stable tops the realm, a throne
  // they hold becomes a prestige target — rivals would rather dethrone the
  // dominant stable than pick off a weaker rival crown of equal difficulty.
  const playerThreat = computePlayerThreatLevel(state);
  const dethroneBonus =
    playerThreat === 'Dominant'
      ? DETHRONE_BONUS.Dominant
      : playerThreat === 'Moderate'
        ? DETHRONE_BONUS.Moderate
        : 0;
  const playerWarriorIds = new Set((state.roster ?? []).map((w) => w.id));

  // Hoisted: `titles` is invariant for the whole roster scan — entries are
  // built once instead of once per warrior.
  const titleEntries = Object.entries(titles);

  let best: CrownCandidate | undefined;
  for (const w of rival.roster) {
    if (!isActive(w)) continue;
    if (isReigningChampion(state, w.id)) continue; // single crown
    if (signed.has(w.id)) continue; // already has a shot booked

    for (const [arenaId, title] of titleEntries) {
      const rec = w.career?.byArena?.[arenaId];
      const venueBouts = (rec?.wins ?? 0) + (rec?.losses ?? 0);
      if (venueBouts < ARENA_TITLE.MIN_BOUTS - 1) continue;
      const eligible = venueBouts >= ARENA_TITLE.MIN_BOUTS;
      const cooldownUntil = title.declinedContenders?.[w.id];
      if (cooldownUntil != null && cooldownUntil > now) continue;

      // Contender-rank bonus only for already-eligible warriors, read off the
      // shared index when present so this stays O(arenas) per stable.
      const rank = perception?.contenderIndexByArena.get(arenaId)?.indexOf(w.id);
      const rankBonus = rank != null && rank >= 0 ? (rank === 0 ? 2 : rank <= 2 ? 1 : 0) : 0;

      const champion = title.champion ? warriorById.get(title.champion.warriorId) : undefined;
      const { score, reason } = scoreThrone(w, arenaId, title, {
        eligible,
        rankBonus,
        champion,
        dethroneBonus,
        playerWarriorIds,
        rival,
        state,
      });

      if (!best || score > best.score || (score === best.score && w.id < best.warrior.id)) {
        best = { warrior: w, arenaId, score, reason };
      }
    }
  }

  if (!best || best.score < CAMPAIGN_SCORE_FLOOR) return undefined;
  return {
    arenaId: best.arenaId,
    warriorId: best.warrior.id,
    score: best.score,
    reason: best.reason,
  };
}

/**
 * Stamp each active rival warrior's `campaignFocus` with the same advisor
 * semantics the player's council uses — rivals and the player evaluate the
 * same archetypes, so a rival "CROWN_BID" contender means exactly what the
 * advisor card would say. REHABILITATION warriors get a recovery assignment
 * so downstream training/booking workers respect the rest marker.
 */
export function assignCampaignRoles(
  rival: RivalStableData,
  state: GameState,
  perception?: PerceptionSnapshot
): RivalStableData {
  const index = perception?.contenderIndexByArena ?? buildContenderIndex(state);
  const assignments: TrainingAssignment[] = [...(rival.trainingAssignments ?? [])];
  const roster = rival.roster.map((w) => {
    if (!isActive(w)) return w;
    const focus = evaluateCampaignFocus(w, state, index);
    if (focus === 'REHABILITATION' && !assignments.some((a) => a.warriorId === w.id)) {
      assignments.push({ warriorId: w.id, type: 'recovery' } as TrainingAssignment);
    }
    return w.campaignFocus === focus ? w : { ...w, campaignFocus: focus };
  });
  return { ...rival, roster, trainingAssignments: assignments };
}

/**
 * Tick crown posture for a stable: refresh the crown assessment, flag crowns
 * worth vacating, and rest warriors who shouldn't risk a training injury or
 * extra booking before a title engagement (signed challengers, champions
 * approaching the Grand Championship bracket).
 */
/**
 * Reign management: vacate a crown whose champion is past their prime and
 * losing, or permanently unable to defend. Declared as intent — the
 * championship pass performs the actual relinquish through its reign delta.
 */
function markCrownsForRelinquish(
  updatedRival: RivalStableData,
  crownsHeld: (readonly [string, string | undefined])[],
  memory: AIAgentMemory,
  week: number,
  gazetteItems: string[]
): RivalStableData {
  const seasonRecord = memory.seasonRecord;
  for (const [arenaId, champId] of crownsHeld) {
    if (!champId) continue;
    const champ = updatedRival.roster.find((w) => w.id === champId);
    if (!champ) continue;
    const declining =
      (champ.age ?? 0) >= RELINQUISH_AGE && (seasonRecord?.losses ?? 0) > (seasonRecord?.wins ?? 0);
    const permanentlyHurt = (champ.injuries ?? []).some((i) => i.permanent);
    if ((declining || permanentlyHurt) && memory.pendingRelinquish == null) {
      memory.pendingRelinquish = arenaId;
      updatedRival = logAgentAction(
        { rival: updatedRival, type: 'STRATEGY', description: `Signals intent to vacate the ${arenaId} crown — ${warriorDisplayName(champ)} is past defending it.`, riskTier: 'Medium', week: week, cause: 'CROWN_RELINQUISH' }
      );
      gazetteItems.push(
        `👑 ${updatedRival.owner.stableName} prepares to vacate the ${arenaId} crown.`
      );
    }
  }
  return updatedRival;
}

/**
 * Protection: signed title-bout warriors and champions inside the Grand
 * Championship prep window rest — no training injury, no extra bookings.
 */
function applyProtectionRests(
  updatedRival: RivalStableData,
  state: GameState,
  crownsHeld: (readonly [string, string | undefined])[],
  week: number
): RivalStableData {
  const signed = signedTitleBoutIds(state);
  const inGrandChampPrep =
    weeksUntilChampionsTournament(state.week) <= GRAND_CHAMP_PREP_WEEKS &&
    weeksUntilChampionsTournament(state.week) > 0;
  const assignments: TrainingAssignment[] = [...(updatedRival.trainingAssignments ?? [])];
  for (const w of updatedRival.roster) {
    if (!isActive(w)) continue;
    if (assignments.some((a) => a.warriorId === w.id)) continue;
    const holdsCrown = crownsHeld.some(([, champId]) => champId === w.id);
    if (signed.has(w.id)) {
      assignments.push({ warriorId: w.id, type: 'recovery' } as TrainingAssignment);
      updatedRival = logAgentAction(
        { rival: updatedRival, type: 'STRATEGY', description: `${warriorDisplayName(w)} rests ahead of a signed title bout.`, riskTier: 'Low', week: week, cause: 'CROWN_DEFENSE' }
      );
    } else if (holdsCrown && inGrandChampPrep) {
      assignments.push({ warriorId: w.id, type: 'recovery' } as TrainingAssignment);
      updatedRival = logAgentAction(
        { rival: updatedRival, type: 'STRATEGY', description: `${warriorDisplayName(w)} rests for the Grand Championship bracket.`, riskTier: 'Low', week: week, cause: 'CROWN_PREP' }
      );
    }
  }
  if (assignments.length !== (updatedRival.trainingAssignments ?? []).length) {
    updatedRival.trainingAssignments = assignments;
  }
  return updatedRival;
}

/** Weekly crown-posture pass: reign upkeep, protection, and campaign ticks. */
export function processCrownPosture(
  rival: RivalStableData,
  state: GameState,
  perception?: PerceptionSnapshot
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  let updatedRival = { ...rival };
  const gazetteItems: string[] = [];
  const week = state.absoluteWeek ?? state.week;

  const assessment = assessCrownOpportunity(updatedRival, state, perception);
  const memory: AIAgentMemory = {
    ...(updatedRival.agentMemory ?? {
      lastTreasury: updatedRival.treasury,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      opponentDossiers: {},
    }),
    crownAssessment: assessment,
  };
  updatedRival.agentMemory = memory;

  // Clear a consumed or obsolete relinquish marker — the pass vacated the
  // throne (or it ended by other means), so there is nothing left to give up.
  const pendingArena = memory.pendingRelinquish;
  if (pendingArena) {
    const holderId =
      perception?.championByArena.get(pendingArena) ??
      state.arenaChampions?.[pendingArena]?.champion?.warriorId;
    if (!holderId || !updatedRival.roster.some((w) => w.id === holderId)) {
      delete memory.pendingRelinquish;
    }
  }

  const crownsHeld = perception
    ? [...perception.championByArena.entries()]
    : Object.entries(state.arenaChampions ?? {}).map(
        ([arenaId, t]) => [arenaId, t?.champion?.warriorId] as const
      );

  updatedRival = markCrownsForRelinquish(updatedRival, crownsHeld, memory, week, gazetteItems);
  updatedRival = applyProtectionRests(updatedRival, state, crownsHeld, week);

  return { updatedRival, gazetteItems };
}
