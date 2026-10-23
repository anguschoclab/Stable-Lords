/**
 * Shared types for offseason event handlers.
 * Runner helpers live in `./helpers`.
 */
import type { LedgerEntry, InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type WarriorId } from '@/types/shared.types';
import type { NewsletterItem } from '@/types/shared.types';

/**
 * Canonical list of offseason event effect types — the single source of
 * truth the offseason.json pool and the EVENT_HANDLERS registry are
 * checked against. Add a new event's effectType here first; the handler
 * registry `satisfies` this set at compile time and the megaplan wiring
 * guard asserts JSON↔tuple parity at test time.
 */
export const OFFSEASON_EFFECT_TYPES = [
  'chaos_rift',
  'unexplained_monolith',
  'tavern_brawl_surprise',
  'goblin_raid',
  'loyal_stray_dog',
  'strange_dream',
  'fame_boost',
  'winter_chill',
  'merchant_blessing',
  'epiphany',
  'tavern_brawl',
  'bards_song',
  'plague_outbreak',
  'black_market_raid',
  'grand_feast',
  'wandering_healer',
  'mystic_vision',
  'wild_animal_attack',
  'loyal_stray',
  'street_performance',
  'chaotic_spells',
  'mysterious_patron',
  'midnight_feast',
  'shadow_training',
  'gladiator_olympics',
  'meteor_shower',
  'underground_pit_fight',
  'rogue_alchemist',
  'dreamweaver_visit',
  'abyssal_bargain',
  'shadow_tournament',
  'wandering_fortune_teller',
  'chaos_weaver_visit',
  'traveling_circus',
  'bounty_hunter_visit',
  'midnight_market',
  'moonlight_duel',
  'shadow_market_run',
  'chaos_spores',
  'secret_fight_club',
  'chaos_weavers_game',
  'chaotic_weather_experiment',
  'chaos_weavers_gift',
  'temporal_anomaly',
  'wandering_mystic',
  'cursed_treasure_discovery',
  'chaos_weavers_prophecy',
  'bountiful_harvest',
  'abyssal_tempest_ritual',
  'offseason_training_camp',
  'shattered_skies_ritual',
  'weeping_skies',
  'suspicious_mushroom_stew',
  'goblin_merchant',
  'wandering_merchant_strange_brew',
  'phantom_sparring',
  'dreamweavers_mist',
  'prismatic_gale_exposure',
  'wandering_blacksmith',
  'fey_trickster',
  'chaos_squall_exposure',
] as const;

/** Offseason event effect type — derived from the canonical tuple above. */
export type OffseasonEffectType = (typeof OFFSEASON_EFFECT_TYPES)[number];

/** Narrative definition for an offseason event — title, effect type, and newsletter text. */
export interface OffseasonEventNarrative {
  title: string;
  effectType: OffseasonEffectType;
  newsletter: string[];
}

/** Context object passed to offseason event handlers — accumulates roster updates, newsletter items, ledger entries, and treasury changes. */
export interface OffseasonEventContext {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: NewsletterItem[];
  ledgerEntries: LedgerEntry[];
  insightTokens: InsightToken[];
  treasuryDelta: number;
}
