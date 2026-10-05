/**
 * Combat Narrator — Consumer of CombatEvents that produces MinuteEvent[] log.
 * Translates pure math results into the flavor text defined in the Design Bible.
 */
import { type CombatEvent, type MinuteEvent } from '@/types/combat.types';
import { getEpithet } from '../../narrative/combatNarrators';
import type { NarrationContext } from './types';
import { EVENT_NARRATORS, type NarrateHelpers } from './narrateEvents/handlers';

/** Builds the per-call accessor bundle resolved against NarrationContext. */
function buildHelpers(ctx: NarrationContext): NarrateHelpers {
  const { rng, nameA, nameD, weaponA, weaponD } = ctx;

  const getName = (actor: 'A' | 'D') => (actor === 'A' ? nameA : nameD);
  const getOpponentName = (actor: 'A' | 'D') => (actor === 'A' ? nameD : nameA);
  const getWeapon = (actor: 'A' | 'D') => (actor === 'A' ? weaponA : weaponD);
  const getStyle = (actor: 'A' | 'D') => (actor === 'A' ? ctx.styleA : ctx.styleD);
  const getMaxHp = (actor: 'A' | 'D') => (actor === 'A' ? ctx.maxHpA : ctx.maxHpD);
  const getFame = (actor: 'A' | 'D') => (actor === 'A' ? ctx.fameA : ctx.fameD);
  const getIsFavorite = (actor: 'A' | 'D') => (actor === 'A' ? ctx.isFavoriteA : ctx.isFavoriteD);
  const getSpeed = (actor: 'A' | 'D') => (actor === 'A' ? ctx.spA : ctx.spD);
  const getOrigin = (actor: 'A' | 'D') => (actor === 'A' ? ctx.originA : ctx.originD);
  const displayName = (actor: 'A' | 'D') => {
    const base = getName(actor);
    const epithet = getEpithet(rng, getOrigin(actor));
    return epithet ?? base;
  };

  const getPostHitRatio = (target: 'A' | 'D', event: CombatEvent): number => {
    if (target === 'A' && ctx.postHpRatioA !== undefined) return ctx.postHpRatioA;
    if (target === 'D' && ctx.postHpRatioD !== undefined) return ctx.postHpRatioD;
    const appliedDmg = (event.metadata?.appliedDamage as number | undefined) ?? event.value ?? 0;
    const prevRatio = target === 'A' ? ctx.prevHpRatioA : ctx.prevHpRatioD;
    return Math.max(0, prevRatio - appliedDmg / getMaxHp(target));
  };

  return {
    rng,
    ctx,
    getName,
    getOpponentName,
    getWeapon,
    getStyle,
    getMaxHp,
    getFame,
    getIsFavorite,
    getSpeed,
    displayName,
    getPostHitRatio,
    stateChangesIssued: new Set(),
  };
}

/**
 * Translates a minute's combat events into narrated log lines via the
 * EVENT_NARRATORS dispatch table.
 */
export function narrateEvents(
  events: CombatEvent[],
  ctx: NarrationContext,
  minute: number
): { log: MinuteEvent[] } {
  const h = buildHelpers(ctx);
  const log: MinuteEvent[] = [];
  for (const event of events) {
    const narrate = EVENT_NARRATORS[event.type];
    if (narrate) log.push(...narrate(event, h, minute, events));
  }
  return { log };
}
