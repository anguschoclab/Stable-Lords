import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { type LedgerEntryId } from '@/types/shared.types';
import {
  pickActiveWarrior,
  announceOffseasonEvent,
  withChosenWarrior,
  type OffseasonEventRun,
  statGrantOutcome,
  grantInsightToken,
} from '../helpers';

/**
 *
 */
export function handleShadowMarketRun(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const cost = 25 + Math.floor(rng.next() * 26);
      ctx.treasuryDelta -= cost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Shadow Market Excursion', -cost, 'other')
      );

      const fameGained = 15;

      grantInsightToken(run, chosen, {
        type: 'Style',
        detail: 'Discovered a hidden technique at the Shadow Market.',
        origin: 'Shadow Market',
      });

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        { mirror: true, announce: { gold: cost } }
      );
    },
  });
}

/**
 *
 */

/**
 *
 */
export function handleLoyalStray(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const cost = 25;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Dog Food & Treats', -cost, 'other'));

  withChosenWarrior({
    ...run,
    apply: (chosen) =>
      statGrantOutcome(chosen, { xp: 10, fame: 5 }, { mirror: true, announce: { gold: cost } }),
  });
}

/**
 *
 */

/**
 *
 */
export function handleBountyHunterVisit(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const goldGained = 150 + Math.floor(rng.next() * 101);
      ctx.treasuryDelta += goldGained;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Bounty Information Payout', goldGained, 'other')
      );

      const fameGained = 10;

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        { mirror: true, announce: { gold: goldGained } }
      );
    },
  });
}

/**
 *
 */

/**
 *
 */
export function handleMidnightMarket(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const cost = 40;
      ctx.treasuryDelta -= cost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Midnight Market Elixirs', -cost, 'other')
      );

      const xpGained = 20;

      grantInsightToken(run, chosen, {
        type: 'Tactic',
        detail: 'Whispers from the Midnight Market revealed a new tactic.',
        origin: 'Midnight Market',
      });

      return statGrantOutcome(chosen, { xp: xpGained }, { announce: { gold: cost } });
    },
  });
}

/**
 *
 */

/**
 *
 */
export function handleMoonlightDuel(run: OffseasonEventRun) {
  const { state, nextWeek, rng, ctx } = run;
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const gold = 150 + Math.floor(rng.next() * 150);
    ctx.treasuryDelta += gold;

    announceOffseasonEvent({
      ...run,
      data: {
        name: chosen.name,
        gold,
      },
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
