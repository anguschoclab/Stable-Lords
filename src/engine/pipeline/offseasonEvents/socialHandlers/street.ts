import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { type LedgerEntryId } from '@/types/shared.types';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  pickActiveWarrior,
  announceOffseasonEvent,
  withChosenWarrior,
} from '../types';

/**
 *
 */
export function handleShadowMarketRun(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const cost = 25 + Math.floor(rng.next() * 26);
    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Shadow Market Excursion', -cost, 'other')
    );

    const fameGained = 15;

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden technique at the Shadow Market.',
        origin: 'Shadow Market',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: { fame: (chosen.fame || 0) + fameGained },
      announce: { gold: cost, fame: fameGained },
    };
  });
}

/**
 *
 */

/**
 *
 */
export function handleLoyalStray(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 25;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Dog Food & Treats', -cost, 'other'));

  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => ({
    updates: {
      xp: (chosen.xp || 0) + 10,
      fame: (chosen.fame || 0) + 5,
    },
    announce: { xp: 10, fame: 5, gold: cost },
  }));
}

/**
 *
 */

/**
 *
 */
export function handleBountyHunterVisit(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const goldGained = 150 + Math.floor(rng.next() * 101);
    ctx.treasuryDelta += goldGained;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Bounty Information Payout', goldGained, 'other')
    );

    const fameGained = 10;

    return {
      updates: { fame: (chosen.fame || 0) + fameGained },
      announce: { gold: goldGained, fame: fameGained },
    };
  });
}

/**
 *
 */

/**
 *
 */
export function handleMidnightMarket(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const cost = 40;
    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Midnight Market Elixirs', -cost, 'other')
    );

    const xpGained = 20;

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Tactic',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Whispers from the Midnight Market revealed a new tactic.',
        origin: 'Midnight Market',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { gold: cost },
    };
  });
}

/**
 *
 */

/**
 *
 */
export function handleMoonlightDuel(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const gold = 150 + Math.floor(rng.next() * 150);
    ctx.treasuryDelta += gold;

    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: chosen.name,
      gold,
    });
    ctx.ledgerEntries.push({
      id: rng.uuid('ledger') as LedgerEntryId,
      week: nextWeek,
      label: 'Moonlight Duel Winnings',
      amount: gold,
      category: 'other',
    });
  }
}

/**
 *
 */
