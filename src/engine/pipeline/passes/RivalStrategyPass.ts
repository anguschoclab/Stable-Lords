import { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { StableId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { updateAIStrategy } from '@/engine/ai/intentEngine';
import { processAIStable } from '@/engine/ai/stableManager';
import { generateRivalStables } from '@/engine/rivals';
import { aiDraftFromPool } from '@/engine/draftService';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import { processTournamentPrep } from '@/engine/ai/workers/tournamentWorker';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import { boutOfferExpirationAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { SeededRNGService, resolveRng } from '@/utils/random';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { persistNPCPlans } from '@/engine/ai/plan/agentPlan';
import { processPoachMarket } from '@/engine/ai/market/poachBid';

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService,
  headless?: boolean
): StateImpact {
  const rng = resolveRng(rootRng, state.absoluteWeek * 7919 + 13);
  const impacts: StateImpact[] = [];
  const globalGazetteItems: string[] = [];

  // 0. Build successor index: maps stableId → first famous retired warrior (fame > 200)
  const successorByStable = buildSuccessorIndex(state.retired);

  // 0.5 Shared perception — built once per tick, consumed by every rival's
  // agent context so per-rival memory work never re-scans the world (B.1).
  const perception = buildPerceptionSnapshot(state);

  // 1. Process Individual Rival Stables (Economy/Strategy)
  let currentRivals = (state.rivals || []).map((rival, index) => {
    const strategySeed = state.absoluteWeek * 31 + index * 997 + (rival.owner.id || '').length;
    const strategy = updateAIStrategy(rival, state, strategySeed);

    // 🎂 1.0 Hardening: Handle Aging & Succession
    const { updatedRival: rivalWithLifecycle, gazetteItems: lifecycleGazette } =
      handleOwnerLifecycle(
        { ...rival, strategy },
        nextWeek,
        new SeededRNGService(strategySeed + 123),
        successorByStable
      );
    globalGazetteItems.push(...lifecycleGazette);

    const { updatedRival: processedRival, isBankrupt, gazetteItems } = processAIStable(
      rivalWithLifecycle,
      state,
      perception
    );
    globalGazetteItems.push(...gazetteItems);

    // D.5 — Intel worker: weekly seeded dossier refresh before planning.
    const intel = processIntel(processedRival, state, perception);
    globalGazetteItems.push(...intel.gazetteItems);

    // D.7 — Tournament worker: TOURNAMENT_CAMPAIGN rest-bias prep.
    const prep = processTournamentPrep(intel.updatedRival, nextWeek);
    globalGazetteItems.push(...prep.gazetteItems);
    const updatedRival = prep.updatedRival;

    if (isBankrupt) {
      const retirementSeed = state.absoluteWeek + index * 1000;
      const generated = generateRivalStables(1, retirementSeed);
      const newStable = generated[0];
      if (newStable) {
        globalGazetteItems.push(
          `🆕 RECRUITMENT: ${newStable.owner.stableName} has debuted in the league under ${newStable.owner.name}!`
        );
        return newStable as RivalStableData;
      }
    }
    return updatedRival;
  });

  // 1.5. World Matchmaking: NPCs propose bouts to each other
  const worldBouts = planWorldBouts(state, rng);
  let boutOffersWithWorld: Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> = {
    ...(state.boutOffers || {}),
  };

  // 🧹 1.6 Hardening: Purge Expired Offers (Prevent state bloat)
  const newBoutOffersWithWorld: Record<BoutOfferId, (typeof boutOffersWithWorld)[BoutOfferId]> =
    {} as Record<BoutOfferId, (typeof boutOffersWithWorld)[BoutOfferId]>;
  for (const [key, offer] of Object.entries(boutOffersWithWorld)) {
    if (offer && boutOfferExpirationAbsoluteWeek(offer) >= state.absoluteWeek + 1) {
      newBoutOffersWithWorld[key as BoutOfferId] = offer;
    }
  }
  boutOffersWithWorld = newBoutOffersWithWorld;

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
}

/**
 * Builds an index mapping stableId → first famous retired warrior (fame > 200).
 * Replaces per-rival O(N) find() scans with O(1) map lookups.
 */
export function buildSuccessorIndex(retired: Warrior[] | undefined): Map<StableId, Warrior> {
  const index = new Map<StableId, Warrior>();
  for (const w of retired || []) {
    if ((w.fame || 0) > 200 && w.stableId && !index.has(w.stableId)) {
      index.set(w.stableId, w);
    }
  }
  return index;
}

/**
 * 🎂 Owner Lifecycle: Handles annual aging and generational succession.
 */
export function handleOwnerLifecycle(
  rival: RivalStableData,
  nextWeek: number,
  rng: IRNGService,
  successorByStable: Map<StableId, Warrior>
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const updatedRival = { ...rival, owner: { ...rival.owner } };
  const gazetteItems: string[] = [];

  // 1. Annual Aging (Occurs on Week 1)
  if (nextWeek === 1) {
    updatedRival.owner.age = (updatedRival.owner.age || 40) + 1;
  }

  // 2. Succession Logic (Starts at age 65, becomes likely by 75)
  const age = updatedRival.owner.age || 40;
  const retirementChance = age < 65 ? 0 : age < 75 ? 0.05 : 0.2;

  if (rng.next() < retirementChance) {
    const generation = (updatedRival.owner.generation || 0) + 1;
    const oldName = updatedRival.owner.name;

    // 🏆 Successor Hunt: O(1) lookup via pre-built index
    const successorCandidate = successorByStable.get(updatedRival.id);

    const newName = successorCandidate
      ? successorCandidate.name
      : `Lord ${updatedRival.owner.stableName.split(' ')[0]} ${'I'.repeat(generation + 1)}`;

    updatedRival.owner = {
      ...updatedRival.owner,
      name: newName,
      age: 25 + Math.floor(rng.next() * 15),
      generation,
      fame: Math.floor(updatedRival.owner.fame * 0.4), // Fame reset on new leadership
      backstoryId: undefined, // Fresh start
    };

    gazetteItems.push(
      `👑 SUCCESSION: ${oldName} has retired from ${updatedRival.owner.stableName}. ${newName} takes the mantle (Generation ${generation})!`
    );
  }

  return { updatedRival, gazetteItems };
}

function handleSeasonalTournaments(
  state: GameState,
  week: number,
  rng: IRNGService,
  _headless?: boolean
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
      newsletterItems: [
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
