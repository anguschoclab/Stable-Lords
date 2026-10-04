/**
 * Shared types and helpers for offseason event handlers.
 */
import type { GameState, LedgerEntry, InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type WarriorId } from '@/types/shared.types';
import type { NewsletterItem } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { isActive } from '@/engine/warrior/warriorStatus';
import { hasInjuries } from '@/engine/injuries/utils';

/** Narrative definition for an offseason event — title, effect type, and newsletter text. */
export interface OffseasonEventNarrative {
  title: string;
  effectType:
    | 'chaos_rift'
    | 'unexplained_monolith'
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
    | 'abyssal_tempest_ritual'
    | 'shattered_skies_ritual'
    | 'weeping_skies'
    | 'suspicious_mushroom_stew'
    | 'offseason_training_camp'
    | 'goblin_merchant'
    | 'wandering_merchant_strange_brew'
    | 'phantom_sparring'
    | 'dreamweavers_mist'
    | 'prismatic_gale_exposure'
    | 'wandering_blacksmith';
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

/** Active warriors, optionally restricted to those carrying no injuries. */
export function getActiveWarriors(state: GameState, healthyOnly = false): Warrior[] {
  return state.roster.filter((w) => isActive(w) && (!healthyOnly || !hasInjuries(w)));
}

/** Pick a random active warrior, or undefined when none are eligible. */
export function pickActiveWarrior(
  state: GameState,
  rng: IRNGService,
  healthyOnly = false
): Warrior | undefined {
  const pool = getActiveWarriors(state, healthyOnly);
  if (pool.length === 0) return undefined;
  return rng.pick(pool) ?? undefined;
}

/**
 *
 */
export interface AnnounceOffseasonEventArgs {
  ctx: OffseasonEventContext;
  rng: IRNGService;
  nextWeek: number;
  e: OffseasonEventNarrative;
  data: Record<string, string | number>;
  category?: NewsletterItem['category'];
}

/** Append a newsletter entry for an offseason event. */
export function announceOffseasonEvent(args: AnnounceOffseasonEventArgs): void {
  const { ctx, rng, nextWeek, e, data } = args;
  const { category } = args;
  pushNewsletterItem({ target: ctx.newsletterItems, rng: rng, week: nextWeek, title: e.title, templates: e.newsletter, data: data, category: category });
}

/** Outcome returned by a `withChosenWarrior` apply callback. */
export interface ChosenWarriorOutcome {
  updates?: Partial<Warrior>;
  announce?: Record<string, string | number>;
}

/**
 *
 */
export interface WithChosenWarriorArgs {
  state: GameState;
  nextWeek: number;
  e: OffseasonEventNarrative;
  rng: IRNGService;
  ctx: OffseasonEventContext;
  apply: (chosen: Warrior) => ChosenWarriorOutcome | undefined;
  healthyOnly?: boolean;
}

/**
 * Pick a random active warrior, run `apply` for side effects (ledger,
 * treasury, insight tokens) and to produce the outcome, then stamp the
 * roster update and announce the event with the warrior's name.
 */
export function withChosenWarrior(args: WithChosenWarriorArgs): void {
  const { state, nextWeek, e, rng, ctx } = args;
  const { apply, healthyOnly = false } = args;
  const chosen = pickActiveWarrior(state, rng, healthyOnly);
  if (!chosen) return;
  const outcome = apply(chosen);
  if (!outcome) return;
  if (outcome.updates) ctx.rosterUpdates.set(chosen.id, outcome.updates);
  announceOffseasonEvent({ ctx: ctx, rng: rng, nextWeek: nextWeek, e: e, data: { name: chosen.name, ...outcome.announce } });
}

/**
 *
 */
export interface WithChosenWarriorNewsArgs {
  state: GameState;
  nextWeek: number;
  e: OffseasonEventNarrative;
  rng: IRNGService;
  ctx: OffseasonEventContext;
  apply: (chosen: Warrior) => string;
}

/**
 * Pick a random active warrior, run `apply` for its branch effects (returning
 * the effect message), then push a newsletter item of `baseMsg + effectMsg`.
 */
export function withChosenWarriorNews(args: WithChosenWarriorNewsArgs): void {
  const { state, nextWeek, e, rng, ctx } = args;
  const { apply } = args;
  const chosen = pickActiveWarrior(state, rng);
  if (!chosen) return;
  const effectMsg = apply(chosen);
  const baseMsg = t(rng.pick(e.newsletter) || '', { name: chosen.name });
  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [`${baseMsg} ${effectMsg}`],
  });
}
