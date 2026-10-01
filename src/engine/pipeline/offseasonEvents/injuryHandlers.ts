/**
 * Injury offseason events — cause injuries to warriors, sometimes with fame/gold side effects.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeInjury } from '@/engine/injuries/utils';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  withChosenWarrior,
} from './types';

/**
 *
 */
export function handleTavernBrawl(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(
    state,
    nextWeek,
    e,
    rng,
    ctx,
    (chosen) => {
      const fameGained = 10 + Math.floor(rng.next() * 11);

      const newInjury = makeInjury(rng, {
        name: 'Bruised Ribs',
        description: 'Painful but manageable.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return {
        updates: {
          fame: (chosen.fame || 0) + fameGained,
          injuries: [...(chosen.injuries || []), newInjury],
        },
        announce: { fame: fameGained },
      };
    },
    true
  );
}

/**
 *
 */
export function handlePlagueOutbreak(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(
    state,
    nextWeek,
    e,
    rng,
    ctx,
    (chosen) => {
      const fameLost = 5 + Math.floor(rng.next() * 10);

      const newInjury = makeInjury(rng, {
        name: 'Camp Fever',
        description: 'Leaves the victim weak and fatigued.',
        severity: 'Minor',
        weeksBase: 2,
        weeksRange: 2,
        penalties: { CN: -2, ST: -1 },
      });

      return {
        updates: {
          fame: Math.max(0, (chosen.fame || 0) - fameLost),
          injuries: [...(chosen.injuries || []), newInjury],
        },
        announce: { fame: fameLost },
      };
    },
    true
  );
}

/**
 *
 */
export function handleWildAnimalAttack(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(
    state,
    nextWeek,
    e,
    rng,
    ctx,
    (chosen) => {
      const fameGained = 5 + Math.floor(rng.next() * 6);

      const newInjury = makeInjury(rng, {
        name: 'Bite Wound',
        description: 'A nasty bite from a wild beast.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return {
        updates: {
          fame: (chosen.fame || 0) + fameGained,
          injuries: [...(chosen.injuries || []), newInjury],
        },
        announce: { fame: fameGained },
      };
    },
    true
  );
}

/**
 *
 */
export function handleGoblinRaid(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const goldLost = 20 + Math.floor(rng.next() * 31);
    ctx.treasuryDelta -= goldLost;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Goblin Raid Loss', -goldLost, 'other'));

    const newInjury = makeInjury(rng, {
      name: 'Goblin Scratch',
      description: 'Nasty scratch from a tiny spear.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { CN: -1 },
    });

    return {
      updates: { injuries: [...(chosen.injuries || []), newInjury] },
      announce: { gold: goldLost },
    };
  });
}

/**
 *
 */
export function handleUndergroundPitFight(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 16);

    const newInjury = makeInjury(rng, {
      name: 'Busted Knuckles',
      description: 'A messy wound from a bare-knuckle pit fight.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 3,
      penalties: { SP: -1, CN: -1 },
    });

    return {
      updates: {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: { fame: fameGained },
    };
  });
}

/**
 *
 */
export function handleTavernBrawlSurprise(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 11);

    const newInjury = makeInjury(rng, {
      name: 'Tavern Bruises',
      description: 'Scrapes and bruises from a sudden tavern brawl.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1 },
    });

    return {
      updates: {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: { fame: fameGained },
    };
  });
}

/**
 *
 */
export function handleSecretFightClub(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 11);
    const newInjury = makeInjury(rng, {
      name: 'Brawler Bruises',
      description: 'Bruises from an unsanctioned underground brawl.',
      severity: 'Minor',
      weeksBase: 2,
      weeksRange: 2,
      penalties: { SP: -1 },
    });
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: { xp: xpGained, fame: fameGained },
    };
  });
}

/**
 *
 */
export function handleChaoticWeatherExperiment(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 10);
    const newInjury = makeInjury(rng, {
      name: 'Magic Burns',
      description: 'Minor burns from a wild weather experiment gone wrong.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1 },
    });
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: { xp: xpGained },
    };
  });
}
