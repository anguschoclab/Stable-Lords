import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
  pickActiveWarrior,
  announceOffseasonEvent,
} from '../types';

/**
 *
 */
export function handleGrandFeast(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldCost = 200 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(
    makeLedgerEntry(rng, nextWeek, 'Grand Feast Expenses', -goldCost, 'other')
  );

  const activeWarriors = getActiveWarriors(state);
  for (const w of activeWarriors) {
    ctx.rosterUpdates.set(w.id, {
      xp: (w.xp || 0) + 10,
    });
  }

  announceOffseasonEvent(ctx, rng, nextWeek, e, { gold: goldCost });
}

/**
 *
 */


/**
 *
 */
export function handleMidnightFeast(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 40 + Math.floor(rng.next() * 61);
  ctx.treasuryDelta -= cost;

  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Midnight Feast Tab', -cost, 'other'));

  const activeWarriors = getActiveWarriors(state);
  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  if (chosen) {
    const xpGained = 15;
    const fameGained = 10;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
      fame: (chosen.fame || 0) + fameGained,
    });

    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
      gold: cost,
    });
  } else {
    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: 'Someone',
      xp: 0,
      fame: 0,
      gold: cost,
    });
  }
}

/**
 *
 */


/**
 *
 */
export function handleStreetPerformance(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const fameGained = 15;
    const goldGained = 50 + Math.floor(rng.next() * 50);
    ctx.treasuryDelta += goldGained;

    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Street Performance Tips', goldGained, 'other')
    );

    const currentFlair = chosen.flair || [];
    const newFlair = currentFlair.includes('Local Hero')
      ? currentFlair
      : [...currentFlair, 'Local Hero'];

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      flair: newFlair,
    });

    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: chosen.name,
      fame: fameGained,
      gold: goldGained,
    });
  }
}

/**
 *
 */


/**
 *
 */
export function handleTravelingCircus(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const xpGained = 20 + Math.floor(rng.next() * 21);
    const fameGained = 15 + Math.floor(rng.next() * 11);
    const cost = 25;

    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Traveling Circus Distraction', -cost, 'other')
    );

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
      fame: (chosen.fame || 0) + fameGained,
    });

    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
    });
  }
}

/**
 *
 */
