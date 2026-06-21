import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId } from '@/types/shared.types';
import {
  handleFameBoost,
  handleWinterChill,
  handleMerchantBlessing,
  handleEpiphany,
  handleTavernBrawl,
  handleBardsSong,
  handlePlagueOutbreak,
  handleBlackMarketRaid,
  handleGrandFeast,
  handleWanderingHealer,
  handleMysticVision,
  handleWildAnimalAttack,
  handleStrangeDream,
  handleLoyalStray,
  handleStreetPerformance,
  handleChaoticSpells,
  handleMysteriousPatron,
  handleMidnightFeast,
  handleShadowTraining,
  handleGladiatorOlympics,
  handleUndergroundPitFight,
  handleMeteorShower,
  handleRogueAlchemist,
  handleDreamweaverVisit,
  handleAbyssalBargain,
  handleTavernBrawlSurprise,
  handleGoblinRaid,
} from './handlers';
import type { OffseasonEventNarrative, OffseasonEventContext } from './types';

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
  fame_boost: handleFameBoost,
  winter_chill: handleWinterChill,
  merchant_blessing: handleMerchantBlessing,
  epiphany: handleEpiphany,
  tavern_brawl: handleTavernBrawl,
  bards_song: handleBardsSong,
  plague_outbreak: handlePlagueOutbreak,
  black_market_raid: handleBlackMarketRaid,
  grand_feast: handleGrandFeast,
  wandering_healer: handleWanderingHealer,
  mystic_vision: handleMysticVision,
  wild_animal_attack: handleWildAnimalAttack,
  strange_dream: handleStrangeDream,
  loyal_stray: handleLoyalStray,
  street_performance: handleStreetPerformance,
  chaotic_spells: handleChaoticSpells,
  mysterious_patron: handleMysteriousPatron,
  midnight_feast: handleMidnightFeast,
  shadow_training: handleShadowTraining,
  gladiator_olympics: handleGladiatorOlympics,
  underground_pit_fight: handleUndergroundPitFight,
  meteor_shower: handleMeteorShower,
  rogue_alchemist: handleRogueAlchemist,
  dreamweaver_visit: handleDreamweaverVisit,
  abyssal_bargain: handleAbyssalBargain,
  tavern_brawl_surprise: handleTavernBrawlSurprise,
  goblin_raid: handleGoblinRaid,
};

/**
 *
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

  const seasonRng = rootRng || new SeededRNGService(state.year * 999 + 1);

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
