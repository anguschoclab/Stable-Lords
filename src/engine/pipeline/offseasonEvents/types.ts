/**
 * Shared types and helpers for offseason event handlers.
 */
import type { GameState, LedgerEntry, InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type WarriorId } from '@/types/shared.types';
import type { NewsletterItem } from '@/types/shared.types';
import { isActive } from '@/engine/warriorStatus';

/**
 *
 */
export interface OffseasonEventNarrative {
  title: string;
  effectType:
    | 'chaos_rift'
    | 'chaotic_weather_experiment'
    | 'fame_boost'
    | 'winter_chill'
    | 'merchant_blessing'
    | 'epiphany'
    | 'tavern_brawl'
    | 'bards_song'
    | 'plague_outbreak'
    | 'black_market_raid'
    | 'grand_feast'
    | 'wandering_healer'
    | 'mystic_vision'
    | 'wild_animal_attack'
    | 'strange_dream'
    | 'street_performance'
    | 'chaotic_spells'
    | 'mysterious_patron'
    | 'loyal_stray'
    | 'midnight_feast'
    | 'shadow_training'
    | 'gladiator_olympics'
    | 'meteor_shower'
    | 'underground_pit_fight'
    | 'rogue_alchemist'
    | 'tavern_brawl_surprise'
    | 'chaos_spores'
    | 'dreamweaver_visit'
    | 'abyssal_bargain'
    | 'goblin_raid'
    | 'fey_trickster'
    | 'shadow_tournament'
    | 'wandering_fortune_teller'
    | 'chaos_weaver_visit'
    | 'traveling_circus'
    | 'bounty_hunter_visit'
    | 'loyal_stray_dog'
    | 'midnight_market'
    | 'shadow_market_run'
    | 'moonlight_duel'
    | 'chaos_weavers_game'
    | 'secret_fight_club'
    | 'chaos_weavers_gift'
    | 'temporal_anomaly'
    | 'chaos_weavers_prophecy'
    | 'wandering_mystic'
    | 'bountiful_harvest'
    | 'abyssal_tempest_ritual';
  newsletter: string[];
}

/**
 *
 */
export interface OffseasonEventContext {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: NewsletterItem[];
  ledgerEntries: LedgerEntry[];
  insightTokens: InsightToken[];
  treasuryDelta: number;
}

/** Active warriors, optionally restricted to those carrying no injuries. */
export function getActiveWarriors(state: GameState, healthyOnly = false): Warrior[] {
  return state.roster.filter(
    (w) => isActive(w) && (!healthyOnly || !w.injuries || w.injuries.length === 0)
  );
}
