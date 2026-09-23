import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { aiDraftFromPool } from '@/engine/draftService';
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
import {
  buildSuccessorIndex,
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardOutput,
} from './rivalStableShard';
import type { EnginePool } from '@/engine/pool/enginePool';

// Re-exported for existing importers (tests, docs).
export { buildSuccessorIndex, handleOwnerLifecycle } from './rivalStableShard';

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

  const finish = (shardOutputs: RivalShardOutput[]): StateImpact => {
    const impacts: StateImpact[] = [];
    const globalGazetteItems: string[] = shardOutputs.flatMap((o) => o.gazetteItems);

    // 1. Process Individual Rival Stables (Economy/Strategy)
    let currentRivals = shardOutputs.map((o) => o.rival);

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

  impacts.push({ boutOffers: boutOffersWithWorld });

  // 2. AI Roster Management — culling/retirement first, then flag
  // `needsRecruit` so the unified draft below can fill same-tick (G9).
  const rosterSeed = state.absoluteWeek * 13 + 7;
  const rosterRng = new SeededRNGService(rosterSeed);
  const { updatedRivals: managedRivals, gazetteItems: rosterGazette } = processAIRosterManagement(
    {
      ...state,
      week: nextWeek,
      rivals: currentRivals,
      boutOffers: boutOffersWithWorld,
    },
    rosterRng
  );
  globalGazetteItems.push(...rosterGazette);
  currentRivals = managedRivals;

  // 3. Draft from Recruitment Pool — sole signing path; honors needsRecruit.
  const draft = aiDraftFromPool(state.recruitPool, currentRivals, nextWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);
  currentRivals = draft.updatedRivals;

  // 3.5. Poaching market (G.2): WEALTH_ACCUMULATION stables bid once per
  // season on high-liability rival warriors. AI-AI bids settle immediately;
  // player-bound bids surface as a publicized decision item only.
  const poach = processPoachMarket({ ...state, rivals: currentRivals }, currentRivals);
  globalGazetteItems.push(...poach.gazetteItems);
  currentRivals = poach.updatedRivals;

  const finalizedRivals = currentRivals;
  impacts.push({ recruitPool: draft.updatedPool });

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
  const resolvedOffers = Object.values(
    boutOffersImpact.boutOffers ?? boutOffersWithWorld
  );
  const plannedRivals = persistNPCPlans(finalizedRivals, resolvedOffers, stateWithWorldBouts);
  const planUpdates = new Map<StableId, Partial<RivalStableData>>();
  plannedRivals.forEach((r, i) => {
    if (r !== finalizedRivals[i]) planUpdates.set(r.id as StableId, r);
  });
  if (planUpdates.size > 0) impacts.push({ rivalsUpdates: planUpdates });

  // 5. Tournament Handling (Every 13 weeks)
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    const tournamentImpact = handleSeasonalTournaments(state, nextWeek, rng, headless);
    impacts.push(tournamentImpact);
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

    return mergeImpacts(impacts);
  };

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
    week * 881
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
