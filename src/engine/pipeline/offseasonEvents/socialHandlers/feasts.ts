import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { getActiveWarriors, announceOffseasonEvent, withChosenWarrior, type OffseasonEventRun, addStat, warriorOutcome } from '../helpers';

/**
 *
 */
export function handleGrandFeast(run: OffseasonEventRun) {
  const { state, nextWeek, rng, ctx } = run;
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

  announceOffseasonEvent({ ...run, data: { gold: goldCost } });
}

/**
 *
 */

/**
 *
 */
export function handleMidnightFeast(run: OffseasonEventRun) {
  const { state, nextWeek, rng, ctx } = run;
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

    announceOffseasonEvent({ ...run, data: {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
      gold: cost,
    } });
  } else {
    announceOffseasonEvent({ ...run, data: {
      name: 'Someone',
      xp: 0,
      fame: 0,
      gold: cost,
    } });
  }
}

/**
 *
 */

/**
 *
 */
export function handleStreetPerformance(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
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

    return warriorOutcome({
        fame: addStat(chosen.fame, fameGained),
        flair: newFlair,
      }, { fame: fameGained, gold: goldGained });
  } });
}

/**
 *
 */

/**
 *
 */
export function handleTravelingCircus(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 21);
    const fameGained = 15 + Math.floor(rng.next() * 11);
    const cost = 25;

    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Traveling Circus Distraction', -cost, 'other')
    );

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: addStat(chosen.fame, fameGained),
      }, { xp: xpGained, fame: fameGained });
  } });
}

/**
 *
 */
