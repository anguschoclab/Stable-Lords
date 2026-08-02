#!/usr/bin/env python3
"""Extract 45 seasonal event handlers from seasonal.ts into seasonalHandlers.ts."""

SEASONAL = "src/engine/pipeline/seasonal.ts"
HANDLERS = "src/engine/pipeline/seasonalHandlers.ts"

with open(SEASONAL, "r") as f:
    lines = f.readlines()

# Line 118 (0-indexed: 117) starts the handlers section "// ─── Individual..."
# Line 1605 (0-indexed: 1604) is the blank line before EVENT_HANDLERS
# We want to extract:
#   - Interfaces (lines 26-83, 0-indexed: 25-82)
#   - Helpers (lines 85-116, 0-indexed: 84-115)
#   - Handlers (lines 118-1604, 0-indexed: 117-1603)

# Find the line indices
interface_start = None
handlers_end = None
event_handlers_start = None

for i, line in enumerate(lines):
    if line.startswith("interface OffseasonEventNarrative"):
        interface_start = i
    if line.startswith("const EVENT_HANDLERS"):
        event_handlers_start = i
        handlers_end = i - 1  # blank line before
        break

# Extract the handler section (interfaces + helpers + handlers)
handler_section = lines[interface_start:event_handlers_start]

# Build the new handlers file
header = """/**
 * Seasonal Event Handlers — Individual Offseason Event Implementations
 * Extracted from seasonal.ts for SRP separation.
 * Each handler processes one offseason event type.
 */
import type { GameState, LedgerEntry } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  type WarriorId,
  type LedgerEntryId,
  type InsightId,
  type InjuryId,
} from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { NewsletterItem } from '@/types/shared.types';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import { isActive } from '@/engine/warriorStatus';

"""

# Make interfaces exported
handler_text = "".join(handler_section)
handler_text = handler_text.replace("interface OffseasonEventNarrative", "export interface OffseasonEventNarrative")
handler_text = handler_text.replace("interface OffseasonEventContext", "export interface OffseasonEventContext")

# Make handler functions exported
import re
handler_text = re.sub(r"^function (handle\w+)", r"export function \1", handler_text, flags=re.MULTILINE)

with open(HANDLERS, "w") as f:
    f.write(header)
    f.write(handler_text)

# Now rewrite seasonal.ts to only have dispatch logic
# Keep imports needed for runSeasonalPass
new_seasonal = """/**
 * Stable Lords — Seasonal Pipeline Pass (Offseason)
 * The Chaos Weaver 🎲
 *
 * Orchestrator: selects an offseason event and dispatches to the appropriate handler.
 * Handler implementations live in seasonalHandlers.ts.
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId } from '@/types/shared.types';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  handleChaosRift,
  handleChaoticWeatherExperiment,
  handleFameBoost,
  handleWinterChill,
  handleMerchantBlessing,
  handleEpiphany,
  handleShadowMarketRun,
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
  handleFeyTrickster,
  handleShadowTournament,
  handleWanderingFortuneTeller,
  handleChaosWeaverVisit,
  handleTravelingCircus,
  handleBountyHunterVisit,
  handleLoyalStrayDog,
  handleMidnightMarket,
  handleMoonlightDuel,
  handleChaosSpores,
  handleSecretFightClub,
  handleChaosWeaversGift,
  handleChaosWeaversGame,
  handleTemporalAnomaly,
  handleWanderingMystic,
} from './seasonalHandlers';

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
  chaos_rift: handleChaosRift,
  chaotic_weather_experiment: handleChaoticWeatherExperiment,
  fame_boost: handleFameBoost,
  winter_chill: handleWinterChill,
  merchant_blessing: handleMerchantBlessing,
  epiphany: handleEpiphany,
  shadow_market_run: handleShadowMarketRun,
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
  fey_trickster: handleFeyTrickster,
  shadow_tournament: handleShadowTournament,
  wandering_fortune_teller: handleWanderingFortuneTeller,
  chaos_weaver_visit: handleChaosWeaverVisit,
  traveling_circus: handleTravelingCircus,
  bounty_hunter_visit: handleBountyHunterVisit,
  loyal_stray_dog: handleLoyalStrayDog,
  midnight_market: handleMidnightMarket,
  moonlight_duel: handleMoonlightDuel,
  chaos_spores: handleChaosSpores,
  secret_fight_club: handleSecretFightClub,
  chaos_weavers_gift: handleChaosWeaversGift,
  chaos_weavers_game: handleChaosWeaversGame,
  temporal_anomaly: handleTemporalAnomaly,
  wandering_mystic: handleWanderingMystic,
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
"""

with open(SEASONAL, "w") as f:
    f.write(new_seasonal)

print("Done - extracted handlers to seasonalHandlers.ts, seasonal.ts is now orchestrator only")
