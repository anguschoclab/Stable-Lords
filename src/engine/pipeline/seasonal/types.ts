import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { NewsletterItem } from '@/types/shared.types';
import type { LedgerEntry } from '@/types/state.types';

export interface OffseasonEventNarrative {
  title: string;
  effectType:
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
    | 'dreamweaver_visit'
    | 'abyssal_bargain'
    | 'goblin_raid';
  newsletter: string[];
}

export interface OffseasonEventContext {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: NewsletterItem[];
  ledgerEntries: LedgerEntry[];
  insightTokens: InsightToken[];
  treasuryDelta: number;
}
