/**
 * Economic offseason events — pure treasury/ledger effects, no warrior roster updates.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { type OffseasonEventNarrative, type OffseasonEventContext, getActiveWarriors } from './types';

export function handleWinterChill(
  __state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 150 + Math.floor(rng.next() * 100);
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Winter Heating & Supplies', -cost, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: cost });
}

export function handleMerchantBlessing(
  __state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const gold = 200 + Math.floor(rng.next() * 200);
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Offseason Sponsorship', gold, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold });
}

export function handleBlackMarketRaid(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(_state);
  const goldLost = 50 + Math.floor(rng.next() * 101);
  ctx.treasuryDelta -= goldLost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Black Market Fines', -goldLost, 'other'));

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
    name: chosen ? chosen.name : 'Someone',
    gold: goldLost,
  });
}

export function handleMysteriousPatron(
  __state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldGained = 100 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta += goldGained;

  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Mysterious Patron Donation', goldGained, 'other'));

  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: goldGained });
}

export function handleBountifulHarvest(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const gold = 200;
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Bountiful Harvest', gold, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold });
}
