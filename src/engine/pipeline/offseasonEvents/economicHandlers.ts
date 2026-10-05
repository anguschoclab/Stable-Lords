import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
/**
 * Economic offseason events — pure treasury/ledger effects, no warrior roster updates.
 */

import { getActiveWarriors, announceOffseasonEvent, type OffseasonEventRun } from './helpers';

/**
 *
 */
export function handleWinterChill(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const cost = 150 + Math.floor(rng.next() * 100);
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(
    makeLedgerEntry(rng, nextWeek, 'Winter Heating & Supplies', -cost, 'other')
  );
  announceOffseasonEvent({ ...run, data: { gold: cost } });
}

/**
 *
 */
export function handleMerchantBlessing(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const gold = 200 + Math.floor(rng.next() * 200);
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Offseason Sponsorship', gold, 'other'));
  announceOffseasonEvent({ ...run, data: { gold } });
}

/**
 *
 */
export function handleBlackMarketRaid(run: OffseasonEventRun) {
  const { state: _state, nextWeek, rng, ctx } = run;
  const activeWarriors = getActiveWarriors(_state);
  const goldLost = 50 + Math.floor(rng.next() * 101);
  ctx.treasuryDelta -= goldLost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Black Market Fines', -goldLost, 'other'));

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  announceOffseasonEvent({ ...run, data: {
    name: chosen ? chosen.name : 'Someone',
    gold: goldLost,
  } });
}

/**
 *
 */
export function handleMysteriousPatron(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const goldGained = 100 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta += goldGained;

  ctx.ledgerEntries.push(
    makeLedgerEntry(rng, nextWeek, 'Mysterious Patron Donation', goldGained, 'other')
  );

  announceOffseasonEvent({ ...run, data: {
    gold: goldGained,
  } });
}

/**
 *
 */
export function handleBountifulHarvest(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const gold = 200;
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Bountiful Harvest', gold, 'other'));
  announceOffseasonEvent({ ...run, data: { gold } });
}
