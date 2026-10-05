import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { aiDraftFromPool } from '@/engine/recruitment/draftService';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { processAllRivalsBoutOffers } from '@/engine/ai/workers/competitionWorker';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { persistNPCPlans } from '@/engine/ai/plan/agentPlan';
import { processPoachMarket } from '@/engine/ai/market/poachBid';
import { isSeasonalTournamentWeek, isChampionsTournamentWeek } from '@/engine/core/absoluteWeek';
import { buildChampionsTournament } from '@/engine/championship/championsTournament';
import type { RivalShardOutput } from '../rivalStableShard';
import { buildWeekOffers } from './offers';
import { runRosterManagement } from './roster';
import { mintFloorRefill, runStarvationAndFreeAgents, successorReplacements } from './churn';

/**
 * Merge stage-1 shard outputs with the world-scope follow-on passes:
 * matchmaking, bids, roster management, draft, poach, offers, plans, and
 * tournament emission.
 */
export function finishRivalPass(
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
    { state: state, currentRivals: currentRivals, nextWeek: nextWeek, boutOffersWithWorld: boutOffersWithWorld, globalGazetteItems: globalGazetteItems, impacts: impacts }
  );

  // 3. Draft from Recruitment Pool — sole signing path; honors needsRecruit.
  //    Free agents share the draft pool; unsold veterans come back out on
  //    the free-agent shelf.
  const draft = aiDraftFromPool({ pool: state.recruitPool, rivals: currentRivals, week: nextWeek, state: state });
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
    { currentRivals: currentRivals, shardOutputs: shardOutputs, draft: draft, state: state, nextWeek: nextWeek, globalGazetteItems: globalGazetteItems, impacts: impacts }
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
