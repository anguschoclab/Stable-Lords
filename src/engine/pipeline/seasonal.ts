/**
 * Stable Lords — Seasonal Pipeline Pass (Offseason)
 * The Chaos Weaver 🎲
 *
 * Orchestrator: selects an offseason event and dispatches to the appropriate handler.
 * Handler implementations live in seasonalHandlers.ts.
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { narrativeContent } from '@/data/narrative';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId } from '@/types/shared.types';
import * as offseason from './offseasonEvents';
import type { OffseasonEventNarrative, OffseasonEventContext } from './offseasonEvents';

const EVENT_HANDLERS: Record<
  string,
  (
    state: GameState,
    nextWeek: number,
    e: OffseasonEventNarrative,
    rng: IRNGService,
    ctx: OffseasonEventContext
  ) => void
> = {
  chaos_rift: offseason.handleChaosRift,
  unexplained_monolith: offseason.handleUnexplainedMonolith,
  chaotic_weather_experiment: offseason.handleChaoticWeatherExperiment,
  fame_boost: offseason.handleFameBoost,
  winter_chill: offseason.handleWinterChill,
  merchant_blessing: offseason.handleMerchantBlessing,
  epiphany: offseason.handleEpiphany,
  shadow_market_run: offseason.handleShadowMarketRun,
  tavern_brawl: offseason.handleTavernBrawl,
  bards_song: offseason.handleBardsSong,
  plague_outbreak: offseason.handlePlagueOutbreak,
  black_market_raid: offseason.handleBlackMarketRaid,
  grand_feast: offseason.handleGrandFeast,
  wandering_healer: offseason.handleWanderingHealer,
  mystic_vision: offseason.handleMysticVision,
  wild_animal_attack: offseason.handleWildAnimalAttack,
  strange_dream: offseason.handleStrangeDream,
  loyal_stray: offseason.handleLoyalStray,
  street_performance: offseason.handleStreetPerformance,
  chaotic_spells: offseason.handleChaoticSpells,
  mysterious_patron: offseason.handleMysteriousPatron,
  midnight_feast: offseason.handleMidnightFeast,
  shadow_training: offseason.handleShadowTraining,
  offseason_training_camp: offseason.handleOffseasonTrainingCamp,
  gladiator_olympics: offseason.handleGladiatorOlympics,
  underground_pit_fight: offseason.handleUndergroundPitFight,
  meteor_shower: offseason.handleMeteorShower,
  rogue_alchemist: offseason.handleRogueAlchemist,
  dreamweaver_visit: offseason.handleDreamweaverVisit,
  abyssal_bargain: offseason.handleAbyssalBargain,
  tavern_brawl_surprise: offseason.handleTavernBrawlSurprise,
  goblin_raid: offseason.handleGoblinRaid,
  fey_trickster: offseason.handleFeyTrickster,
  shadow_tournament: offseason.handleShadowTournament,
  wandering_fortune_teller: offseason.handleWanderingFortuneTeller,
  chaos_weaver_visit: offseason.handleChaosWeaverVisit,
  traveling_circus: offseason.handleTravelingCircus,
  bounty_hunter_visit: offseason.handleBountyHunterVisit,
  loyal_stray_dog: offseason.handleLoyalStrayDog,
  midnight_market: offseason.handleMidnightMarket,
  moonlight_duel: offseason.handleMoonlightDuel,
  chaos_spores: offseason.handleChaosSpores,
  secret_fight_club: offseason.handleSecretFightClub,
  chaos_weavers_gift: offseason.handleChaosWeaversGift,
  chaos_weavers_game: offseason.handleChaosWeaversGame,
  temporal_anomaly: offseason.handleTemporalAnomaly,
  chaos_weavers_prophecy: offseason.handleChaosWeaversProphecy,
  wandering_mystic: offseason.handleWanderingMystic,

  bountiful_harvest: offseason.handleBountifulHarvest,
  cursed_treasure_discovery: offseason.handleCursedTreasureDiscovery,
  abyssal_tempest_ritual: offseason.handleAbyssalTempestRitual,
  shattered_skies_ritual: offseason.handleShatteredSkiesRitual,
  weeping_skies: offseason.handleWeepingSkies,
  suspicious_mushroom_stew: offseason.handleSuspiciousMushroomStew,
  goblin_merchant: offseason.handleGoblinMerchant,
  wandering_merchant_strange_brew: offseason.handleWanderingMerchantStrangeBrew,
  phantom_sparring: offseason.handlePhantomSparringPartner,
  dreamweavers_mist: offseason.handleDreamweaversMist,
  prismatic_gale_exposure: offseason.handlePrismaticGaleExposure,
};

/**
 * Runs the seasonal (offseason) pipeline pass.
 * Selects one random offseason event and dispatches to its handler.
 */
export function runSeasonalPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  // Only trigger on the transition to week 1 (off-season)
  if (nextWeek !== 1) {
    return {};
  }

  const seasonRng = resolveRng(rootRng, state.year * 999 + 1);

  // Safe cast for our dynamic offseason data
  const events = (
    narrativeContent as unknown as { offseason_events: Record<string, OffseasonEventNarrative> }
  ).offseason_events;

  if (!events) {
    return {};
  }

  const eventKeys = Object.keys(events);
  if (eventKeys.length === 0) return {};

  const chosenEventKey = seasonRng.pick(eventKeys);
  if (!chosenEventKey) return {};
  const e = events[chosenEventKey];
  if (!e) return {};

  const ctx: OffseasonEventContext = {
    rosterUpdates: new Map<WarriorId, Partial<Warrior>>(),
    newsletterItems: [],
    ledgerEntries: [],
    insightTokens: [],
    treasuryDelta: 0,
  };

  const handler = EVENT_HANDLERS[e.effectType];
  if (handler) {
    handler(state, nextWeek, e, seasonRng, ctx);
  }

  const impact: StateImpact = {
    rosterUpdates: ctx.rosterUpdates,
    newsletterItems: ctx.newsletterItems,
    ...(ctx.ledgerEntries.length > 0 ? { ledgerEntries: ctx.ledgerEntries } : {}),
    ...(ctx.treasuryDelta !== 0 ? { treasuryDelta: ctx.treasuryDelta } : {}),
    ...(ctx.insightTokens.length > 0 ? { insightTokens: ctx.insightTokens } : {}),
  };

  return impact;
}
