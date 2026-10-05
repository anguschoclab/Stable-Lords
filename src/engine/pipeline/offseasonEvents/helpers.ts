/**
 * Shared runner helpers for offseason event handlers.
 *
 * Every handler receives a single {@link OffseasonEventRun} bundle from the
 * seasonal pass and uses the runners here to pick a target warrior, apply
 * effects, and announce the outcome.
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { NewsletterItem } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { isActive } from '@/engine/warrior/warriorStatus';
import { hasInjuries } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import type { OffseasonEventNarrative, OffseasonEventContext } from './types';

/** Bundled args the seasonal pass hands to every offseason event handler. */
export interface OffseasonEventRun {
  state: GameState;
  nextWeek: number;
  e: OffseasonEventNarrative;
  rng: IRNGService;
  ctx: OffseasonEventContext;
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

/** Args for {@link announceOffseasonEvent}. */
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

/** Args for {@link withChosenWarrior} — the run bundle plus the apply callback. */
export interface WithChosenWarriorArgs extends OffseasonEventRun {
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

/** Args for {@link withChosenWarriorNews} — the run bundle plus the apply callback. */
export interface WithChosenWarriorNewsArgs extends OffseasonEventRun {
  apply: (chosen: Warrior) => string;
}

/** `(value ?? 0) + delta` — the add-to-optional-counter idiom used by outcome updates. */
export function addStat(value: number | undefined, delta: number): number {
  return (value || 0) + delta;
}

/** `chosen.injuries` plus `injury` appended — the standard injury outcome field. */
export function withAddedInjury(chosen: Warrior, injury: Warrior['injuries'][number]): Warrior['injuries'] {
  return [...(chosen.injuries || []), injury];
}

/** Build the standard chosen-warrior outcome: roster updates + optional announce data. */
export function warriorOutcome(
  updates: Partial<Warrior>,
  announce: Record<string, string | number> = {}
): ChosenWarriorOutcome {
  return { updates, announce };
}

/** Parameters for {@link grantInsightToken} — warrior identity and week come from `run`/`chosen`. */
export type OffseasonInsightSpec = Omit<
  Parameters<typeof makeInsightToken>[1],
  'warriorId' | 'warriorName' | 'discoveredWeek'
>;

/**
 * Grant `chosen` an offseason insight token: pushes a `makeInsightToken` onto
 * `run.ctx.insightTokens` with warrior identity and `run.nextWeek` filled in.
 */
export function grantInsightToken(
  run: OffseasonEventRun,
  chosen: Warrior,
  spec: OffseasonInsightSpec
): void {
  run.ctx.insightTokens.push(
    makeInsightToken(run.rng, {
      ...spec,
      warriorId: chosen.id,
      warriorName: chosen.name,
      discoveredWeek: run.nextWeek,
    })
  );
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
