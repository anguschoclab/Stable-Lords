import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { aiDraftFromPool } from '@/engine/recruitment/draftService';
import { warriorToPoolWarrior, type PoolWarrior } from '@/engine/recruitment/recruitment';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import { pruneBoutOffers } from '@/engine/bout/offerCleanup';
import { SeededRNGService, resolveRng } from '@/utils/random';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { persistNPCPlans } from '@/engine/ai/plan/agentPlan';
import { processPoachMarket } from '@/engine/ai/market/poachBid';
import { isSeasonalTournamentWeek, isChampionsTournamentWeek } from '@/engine/core/absoluteWeek';
import { buildChampionsTournament } from '@/engine/championship/championsTournament';
import { checkBudget } from '@/engine/ai/workers/budgetWorker';
import { AI_GENERATED_RECRUIT_COST } from '@/constants/ai';
import {
  STABLE_STARVATION_WEEKS,
  WORLD_RIVAL_FLOOR,
  EXPANSION_MINT_ATTEMPTS,
} from '@/constants/world';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import {
  buildSuccessorIndex,
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardOutput,
} from './rivalStableShard';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '@/engine/rivals';
import type { EnginePool } from '@/engine/pool/enginePool';

// Re-exported for existing importers (tests, docs).
export { buildSuccessorIndex, handleOwnerLifecycle } from './rivalStableShard';

/**
 * World matchmaking, per-rival bid generation, and offer conversion — the
 * full "who is fighting whom" stage for the coming week. Returns the merged
 * boutOffers map (existing + pruned + world bouts + bid offers).
 */
function buildWeekOffers(
  state: GameState,
  currentRivals: RivalStableData[],
  rng: IRNGService
): Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> {
  // 1.5. World Matchmaking: NPCs propose bouts to each other
  const worldBouts = planWorldBouts(state, rng);
  let boutOffersWithWorld: Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> = {
    ...(state.boutOffers || {}),
  };

  // 🧹 1.6 Hardening: Purge Expired Offers (Prevent state bloat).
  // Shares the single cleanup contract with finalizeState (offerCleanup.ts).
  boutOffersWithWorld = pruneBoutOffers(boutOffersWithWorld, state.absoluteWeek);

  if (worldBouts.length > 0) {
    worldBouts.forEach((o) => {
      boutOffersWithWorld[o.id] = o;
    });
  }

  // 1.7. Generate bout bids for each rival and convert to offers
  const allBids: {
    bid: import('@/engine/ai/workers/competitionWorker/types').BoutBid;
    rivalId: string;
  }[] = [];
  for (const rival of currentRivals) {
    const { bids } = generateBoutBids(
      rival,
      state.absoluteWeek + 1,
      state.weather ?? 'Clear',
      state.crowdMood ?? 'Calm',
      currentRivals,
      // Player-aware context: vendettas may target the player roster and the
      // player's challenge/avoid marks steer contact (G1/G4).
      state
    );
    for (const bid of bids) {
      allBids.push({ bid, rivalId: rival.id as string });
    }
  }

  // Build set of warrior IDs already in pending offers to prevent double-booking
  const existingOfferWarriorIds = new Set<string>();
  for (const offer of Object.values(boutOffersWithWorld)) {
    if (offer && offer.status === 'Proposed') {
      for (const wId of offer.warriorIds) {
        existingOfferWarriorIds.add(wId as string);
      }
    }
  }

  const bidOffers = convertBidsToOffers(
    allBids,
    currentRivals,
    { ...state, boutOffers: boutOffersWithWorld },
    rng,
    existingOfferWarriorIds
  );

  for (const offer of bidOffers) {
    boutOffersWithWorld[offer.id] = offer;
  }
  return boutOffersWithWorld;
}

/**
 * Bankruptcy successors carry a new id, which rivalsUpdates can't reach —
 * swap them in explicitly or the bankrupt stable lingers as a ghost.
 *
 * Same-week successors mint against the pre-pass snapshot, so two folds can
 * debut identical names. Re-suffix at merge time — declaration order is the
 * deterministic tiebreaker, and both the in-line and pooled shard paths
 * converge here.
 */
function successorReplacements(shardOutputs: RivalShardOutput[], state: GameState): StateImpact[] {
  const liveStableNames = new Set((state.rivals ?? []).map((r) => r.owner.stableName));
  const liveOwnerNames = new Set((state.rivals ?? []).map((r) => r.owner.name));
  if (state.player) {
    liveStableNames.add(state.player.stableName);
    liveOwnerNames.add(state.player.name);
  }
  const rivalReplacements = new Map<StableId, RivalStableData>();
  for (const o of shardOutputs) {
    if (!o.replacesStableId) continue;
    const stableName = uniqueStableName(o.rival.owner.stableName, liveStableNames);
    const ownerName = uniqueOwnerName(o.rival.owner.name, liveOwnerNames);
    if (stableName !== o.rival.owner.stableName || ownerName !== o.rival.owner.name) {
      o.rival = { ...o.rival, owner: { ...o.rival.owner, stableName, name: ownerName } };
    }
    liveStableNames.add(stableName);
    liveOwnerNames.add(ownerName);
    rivalReplacements.set(o.replacesStableId, o.rival);
  }
  return rivalReplacements.size > 0 ? [{ rivalReplacements }] : [];
}

/**
 * Warriors of stables dissolved by this tick's bankruptcy swap re-enter the
 * world as free-agent recruits instead of silently vanishing (Dead and
 * Retired warriors keep their existing destinations).
 */
function collectFreedRecruits(
  shardOutputs: RivalShardOutput[],
  state: GameState,
  nextWeek: number
): PoolWarrior[] {
  const rng = new SeededRNGService(state.absoluteWeek * 31 + 101);
  const freed: PoolWarrior[] = [];
  for (const o of shardOutputs) {
    if (!o.replacesStableId) continue;
    const dissolved = (state.rivals ?? []).find((r) => r.id === o.replacesStableId);
    for (const w of dissolved?.roster ?? []) {
      if (w.status === 'Active') freed.push(warriorToPoolWarrior(w, nextWeek, rng));
    }
  }
  return freed;
}

/** Active warriors of starvation-folded stables re-enter as free agents. */
function collectStarvedRecruits(folded: RivalStableData[], nextWeek: number): PoolWarrior[] {
  const rng = new SeededRNGService(nextWeek * 131 + 17);
  const freed: PoolWarrior[] = [];
  for (const r of folded) {
    for (const w of r.roster) {
      if (w.status === 'Active') freed.push(warriorToPoolWarrior(w, nextWeek, rng));
    }
  }
  return freed;
}

/**
 * AI Roster Management — culling/retirement first, then flag `needsRecruit`
 * so the unified draft can fill same-tick (G9). Returns the managed rivals;
 * appends gazette items and routes culled warriors into `state.retired` —
 * without the retired impact they vanish from the world entirely (and the
 * vacancy phase can only guess 'retired').
 */
function runRosterManagement(
  state: GameState,
  currentRivals: RivalStableData[],
  nextWeek: number,
  boutOffersWithWorld: Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]>,
  globalGazetteItems: string[],
  impacts: StateImpact[]
): RivalStableData[] {
  const rosterRng = new SeededRNGService(state.absoluteWeek * 13 + 7);
  const { updatedRivals, gazetteItems, retiredWarriors, legacyFounders } =
    processAIRosterManagement(
      {
        ...state,
        week: nextWeek,
        rivals: currentRivals,
        boutOffers: boutOffersWithWorld,
      },
      rosterRng
    );
  globalGazetteItems.push(...gazetteItems);
  if (retiredWarriors.length > 0) impacts.push({ retired: retiredWarriors });
  if (legacyFounders.length > 0) {
    // Append-delta: the queue's wholesale write belongs to the system pass's
    // churn in this same stage — a same-snapshot replace would clobber it.
    impacts.push({ legacyFounderEnqueue: legacyFounders });
  }
  return updatedRivals;
}

/**
 * Starvation fold + free-agent reconciliation. A stable that has sat below
 * its roster minimum for STABLE_STARVATION_WEEKS and still can't afford even
 * the cheapest recruit collapses — its warriors reach the free-agent list.
 * Deltas, never a replace: the system pass's seasonal churn appends displaced
 * veterans in this same stage snapshot.
 */
function runStarvationAndFreeAgents(
  currentRivals: RivalStableData[],
  shardOutputs: RivalShardOutput[],
  draft: ReturnType<typeof aiDraftFromPool>,
  state: GameState,
  nextWeek: number,
  globalGazetteItems: string[],
  impacts: StateImpact[]
): RivalStableData[] {
  const folded: RivalStableData[] = [];
  currentRivals = currentRivals.filter((r) => {
    if ((r.weeksBelowMin ?? 0) < STABLE_STARVATION_WEEKS) return true;
    if (!checkBudget(r, AI_GENERATED_RECRUIT_COST, 'ROSTER').isAffordable) {
      folded.push(r);
      globalGazetteItems.push(
        `💀 COLLAPSE: ${r.owner.stableName} has folded — ${r.owner.name} could no longer field a roster.`
      );
      return false;
    }
    return true;
  });
  if (folded.length > 0) {
    impacts.push({ rivalsRemovals: folded.map((r) => r.id as StableId) });
  }

  impacts.push({
    recruitPool: draft.updatedPool ?? state.recruitPool ?? [],
  });
  const draftedOut = (state.freeAgents ?? [])
    .filter((w) => !(draft.updatedFreeAgents ?? []).some((u) => u.id === w.id))
    .map((w) => w.id);
  if (draftedOut.length > 0) impacts.push({ freeAgentRemovals: draftedOut });
  const freed = [
    ...collectFreedRecruits(shardOutputs, state, nextWeek),
    ...collectStarvedRecruits(folded, nextWeek),
  ];
  if (freed.length > 0) impacts.push({ freeAgentAdditions: freed });
  return currentRivals;
}

/**
 * Weekly world-floor refill. The seasonal churn's `refillToFloor` only runs
 * quarterly, so starvation folds and dropped bankruptcy swaps can strand the
 * world under WORLD_RIVAL_FLOOR for up to 13 weeks. Mint replacements at the
 * merge seam — this is the only point that sees the post-fold roster — so
 * every removal path leaves the world at or above the floor the same week.
 */
function mintFloorRefill(
  state: GameState,
  currentRivals: RivalStableData[],
  nextWeek: number
): RivalStableData[] {
  const deficit = WORLD_RIVAL_FLOOR - currentRivals.length;
  if (deficit <= 0) return [];

  const postFoldState = { ...state, rivals: currentRivals };
  const usedStableIds = new Set(currentRivals.map((r) => r.id));
  const usedWarriorIds = collectUsedWarriorIds(postFoldState);
  const usedWarriorNames = collectUsedWarriorNames(postFoldState);
  const liveStableNames = new Set(currentRivals.map((r) => r.owner.stableName));
  const liveOwnerNames = new Set(currentRivals.map((r) => r.owner.name));
  if (state.player) {
    liveStableNames.add(state.player.stableName);
    liveOwnerNames.add(state.player.name);
  }

  const minted: RivalStableData[] = [];
  for (let i = 0; i < deficit; i++) {
    for (let attempt = 0; attempt < EXPANSION_MINT_ATTEMPTS; attempt++) {
      const seed = state.absoluteWeek * 6151 + i * 100003 + attempt * 7919;
      const stable = generateRivalStables(1, seed, nextWeek, usedWarriorNames)[0];
      if (!stable) break;
      if (usedStableIds.has(stable.id) || stable.roster.some((w) => usedWarriorIds.has(w.id))) {
        continue;
      }
      const stamped = {
        ...stable,
        owner: {
          ...stable.owner,
          stableName: uniqueStableName(stable.owner.stableName, liveStableNames),
          name: uniqueOwnerName(stable.owner.name, liveOwnerNames),
        },
        establishedAbsoluteWeek: state.absoluteWeek,
      } as RivalStableData;
      minted.push(stamped);
      usedStableIds.add(stable.id);
      liveStableNames.add(stamped.owner.stableName);
      liveOwnerNames.add(stamped.owner.name);
      for (const w of stable.roster) {
        usedWarriorIds.add(w.id);
        usedWarriorNames.add(w.name);
      }
      break;
    }
  }
  return minted;
}

/**
 * Merge stage-1 shard outputs with the world-scope follow-on passes:
 * matchmaking, bids, roster management, draft, poach, offers, plans, and
 * tournament emission.
 */
function finishRivalPass(
  shardOutputs: RivalShardOutput[],
  state: GameState,
  nextWeek: number,
  rng: IRNGService,
  headless: boolean | undefined
): StateImpact {
  const impacts: StateImpact[] = [];
  const globalGazetteItems: string[] = shardOutputs.flatMap((o) => o.gazetteItems);

  // 1. Process Individual Rival Stables (Economy/Strategy)
  // successorReplacements also re-suffixes same-week name collisions on
  // o.rival — run it before currentRivals snapshots the objects.
  impacts.push(...successorReplacements(shardOutputs, state));
  let currentRivals = shardOutputs.map((o) => o.rival);

  // 1.5–1.7. Matchmaking + bids → offers
  const boutOffersWithWorld = buildWeekOffers(state, currentRivals, rng);
  impacts.push({ boutOffers: boutOffersWithWorld });

  currentRivals = runRosterManagement(
    state,
    currentRivals,
    nextWeek,
    boutOffersWithWorld,
    globalGazetteItems,
    impacts
  );

  // 3. Draft from Recruitment Pool — sole signing path; honors needsRecruit.
  //    Free agents share the draft pool; unsold veterans come back out on
  //    the free-agent shelf.
  const draft = aiDraftFromPool(state.recruitPool, currentRivals, nextWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);
  currentRivals = draft.updatedRivals;

  // 3.5. Poaching market (G.2): WEALTH_ACCUMULATION stables bid once per
  // season on high-liability rival warriors. AI-AI bids settle immediately;
  // player-bound bids surface as a publicized decision item only.
  const poach = processPoachMarket({ ...state, rivals: currentRivals }, currentRivals);
  globalGazetteItems.push(...poach.gazetteItems);
  currentRivals = poach.updatedRivals;

  // 3.9. Starvation fold + free-agent delta merge.
  currentRivals = runStarvationAndFreeAgents(
    currentRivals,
    shardOutputs,
    draft,
    state,
    nextWeek,
    globalGazetteItems,
    impacts
  );

  // 3.95. World-floor refill — starvation folds above can strand the world
  // below WORLD_RIVAL_FLOOR for a whole season; mint same-week replacements.
  const floorMinted = mintFloorRefill(state, currentRivals, nextWeek);
  if (floorMinted.length > 0) {
    impacts.push({ rivalsAdditions: floorMinted });
    currentRivals = [...currentRivals, ...floorMinted];
    for (const m of floorMinted) {
      globalGazetteItems.push(
        `🆕 RECRUITMENT: ${m.owner.stableName} has been granted an arena license as a new Minor rival!`
      );
    }
  }

  const finalizedRivals = currentRivals;

  impacts.push(...resolveRivalOffersAndPlans(state, boutOffersWithWorld, finalizedRivals));
  impacts.push(...weekEndImpacts(state, nextWeek, rng, headless, globalGazetteItems));

  return mergeImpacts(impacts);
}

/**
 * Tournament emission + the consolidated gazette newsletter — the closing
 * writes of the rival pass. Seasonals own SEASONAL_TOURNAMENT_WEEKS; the
 * champions-only Grand Championship owns week 52 (no seasonal pools that
 * week, so a champion can never be double-booked into two brackets).
 */
function weekEndImpacts(
  state: GameState,
  nextWeek: number,
  rng: IRNGService,
  headless: boolean | undefined,
  globalGazetteItems: string[]
): StateImpact[] {
  const impacts: StateImpact[] = [];
  if (isSeasonalTournamentWeek(nextWeek)) {
    impacts.push(handleSeasonalTournaments(state, nextWeek, rng, headless));
  } else if (isChampionsTournamentWeek(nextWeek)) {
    impacts.push(buildChampionsTournament(state, nextWeek, rng, headless));
  }
  if (globalGazetteItems.length > 0) {
    impacts.push({
      newsletterItems: [
        {
          id: rng.uuid(),
          week: nextWeek,
          title: 'Intelligence & Strategy Report',
          items: globalGazetteItems,
        },
      ],
    });
  }
  return impacts;
}

/**
 * Steps 4–4.6: aggregate rival updates, run the contract-decision phase, and
 * commit plans for NPC warriors whose bouts Signed this tick.
 */
function resolveRivalOffersAndPlans(
  state: GameState,
  boutOffersWithWorld: GameState['boutOffers'],
  finalizedRivals: RivalStableData[]
): StateImpact[] {
  const impacts: StateImpact[] = [];

  // 4. Final Aggregation of Rival Updates
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  finalizedRivals.forEach((r) => {
    rivalsUpdates.set(r.id as StableId, r);
  });
  impacts.push({ rivalsUpdates });

  // 4.5. Contract Decision Phase: AI Stables accept/decline pending boutique offers
  const stateWithWorldBouts = { ...state, boutOffers: boutOffersWithWorld };
  const boutOffersImpact = processAllRivalsBoutOffers(stateWithWorldBouts, finalizedRivals);
  impacts.push(boutOffersImpact);

  // 4.6. Plan Commitment (E.1): NPC warriors whose bouts Signed this tick get
  // a persisted plan — observable by Expert scouting, input to rematch logic.
  const resolvedOffers = Object.values(boutOffersImpact.boutOffers ?? boutOffersWithWorld);
  const plannedRivals = persistNPCPlans(finalizedRivals, resolvedOffers, stateWithWorldBouts);
  const planUpdates = new Map<StableId, Partial<RivalStableData>>();
  plannedRivals.forEach((r, i) => {
    if (r !== finalizedRivals[i]) planUpdates.set(r.id as StableId, r);
  });
  if (planUpdates.size > 0) impacts.push({ rivalsUpdates: planUpdates });

  return impacts;
}

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 *
 * The per-rival stage-1 loop runs through `rivalStableShard.processRivalStable`
 * — in-line by default, or distributed across the engine pool's shard workers
 * when `pool.size > 1`. Shard output is order-preserving, so both paths merge
 * identically.
 */
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService,
  headless?: boolean
): StateImpact;
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng: IRNGService | undefined,
  headless: boolean | undefined,
  pool: EnginePool | undefined
): StateImpact | Promise<StateImpact>;
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService,
  headless?: boolean,
  pool?: EnginePool
): StateImpact | Promise<StateImpact> {
  const rng = resolveRng(rootRng, state.absoluteWeek * 7919 + 13);

  // 0. Build successor index: maps stableId → first famous retired warrior (fame > 200)
  const successorByStable = buildSuccessorIndex(state.retired);

  // 0.5 Shared perception — built once per tick, consumed by every rival's
  // agent context so per-rival memory work never re-scans the world (B.1).
  const perception = buildPerceptionSnapshot(state);

  const shardCtx: RivalShardContext = { state, perception, successorByStable, nextWeek };
  const inputs = (state.rivals || []).map((rival, index) => ({ rival, index }));
  const finish = (shardOutputs: RivalShardOutput[]) =>
    finishRivalPass(shardOutputs, state, nextWeek, rng, headless);

  // In-line by default; distributed across shard workers when a pool is
  // configured. Both paths run the same processRivalStable shard function
  // and merge in declaration order — output is identical by construction.
  return pool && pool.size > 1
    ? pool.mapRivalShards(inputs, shardCtx).then(finish)
    : finish(runRivalShardChunk(inputs, shardCtx));
}

function handleSeasonalTournaments(
  state: GameState,
  week: number,
  rng: IRNGService,
  headless?: boolean
): StateImpact {
  const tournaments = TournamentSelectionService.generateSeasonalTiers(
    state,
    week,
    state.season,
    ((state.absoluteWeek ?? week - 1) + 1) * 881
  );
  const tournamentNews: string[] = tournaments.map(
    (tour) => `🏆 ${tour.name} announced! Brackets set for the coming week.`
  );

  return mergeImpacts([
    { tournaments: [...(state.tournaments || []), ...tournaments] },
    {
      isTournamentWeek: true,
      activeTournamentId: tournaments[0]?.id,
      day: 0,
      // Player-facing flavor — suppressed in headless mode per pipeline convention.
      newsletterItems: headless
        ? []
        : [
            {
              id: rng.uuid(),
              week: week,
              title: '🎖️ TOURNAMENT ANNOUNCEMENT',
              items: tournamentNews,
            },
          ],
    },
  ]);
}
