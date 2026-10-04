import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { hasInjuries } from '@/engine/injuries/utils';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  withChosenWarrior,
} from '../types';
import { isActive } from '@/engine/warrior/warriorStatus';

/**
 *
 */
export function handleWanderingHealer(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldCost = 50 + Math.floor(rng.next() * 51);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Medical Tonics', -goldCost, 'upkeep'));

  const activeInjured = state.roster.filter((w) => isActive(w) && hasInjuries(w));

  const chosen = activeInjured.length > 0 ? rng.pick(activeInjured) : null;
  if (chosen) {
    const remainingInjuries = [...(chosen.injuries || [])];
    if (remainingInjuries.length > 0) {
      const injuryIndex = Math.floor(rng.next() * remainingInjuries.length);
      remainingInjuries.splice(injuryIndex, 1);
    }
    ctx.rosterUpdates.set(chosen.id, {
      injuries: remainingInjuries,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[1] || '', { name: chosen.name, gold: goldCost })],
    });
  } else {
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[0] || '', { gold: goldCost })],
    });
  }
}

/**
 *
 */

/**
 *
 */
export function handleWanderingFortuneTeller(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 30;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Fortune Teller Reading', -cost, 'other'));

  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 15;

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden rhythm in their fighting style.',
        origin: 'Wandering Fortune Teller',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { gold: cost },
    };
  } });
}

/**
 *
 */

/**
 *
 */
export function handleDreamweaverVisit(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Dreamweaver vision revealed hidden stylistic knowledge.',
        origin: 'Dreamweaver',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { xp: xpGained },
    };
  } });
}

/** Handles the Goblin Merchant offseason event outcome. */

/** Handles the Goblin Merchant offseason event outcome. */
export function handleGoblinMerchant(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const cost = 50 + Math.floor(rng.next() * 50);

    const attrs = chosen.attributes;

    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Strange Herbs', -cost, 'other'));

    return {
      updates: {
        attributes: {
          ...attrs,
          CN: attrs.CN + 1,
          WL: attrs.WL + 1,
        },
      },
      announce: { gold: cost },
    };
  } });
}
