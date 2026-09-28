import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  withChosenWarrior,
  withChosenWarriorNews,
} from '../types';

/** Handler for the Chaos Rift offseason event — grants XP, fame, and gold from a chaos crystal. */
export function handleChaosRift(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 25;
    const fameGained = 15;
    const goldGained = 150;

    ctx.treasuryDelta += goldGained;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Sold Chaos Crystal', goldGained, 'other')
    );

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Touched the raw essence of the Chaos Rift.',
        origin: 'Chaos Rift',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      },
      announce: { xp: xpGained, fame: fameGained },
    };
  });
}


/** Handler for the Chaotic Spells offseason event — random magical effects on active warriors. */
export function handleChaoticSpells(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarriorNews(state, nextWeek, e, rng, ctx, (chosen) => {
    const roll = rng.next();

    if (roll < 0.33) {
      const xpGained = 10 + Math.floor(rng.next() * 11);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });
      return `They feel a surge of unnatural energy! (+${xpGained} XP)`;
    }

    if (roll < 0.66) {
      const newInjury = makeInjury(rng, {
        name: 'Arcane Burns',
        description: 'Singed by erratic magic.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { SP: -1, CN: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, {
        injuries: [...(chosen.injuries || []), newInjury],
      });
      return 'They sustained mild arcane burns. (Minor Injury)';
    }

    const fameLost = 5 + Math.floor(rng.next() * 6);
    ctx.rosterUpdates.set(chosen.id, {
      fame: Math.max(0, (chosen.fame || 0) - fameLost),
    });
    return `They were temporarily turned an embarrassing shade of purple. (-${fameLost} Fame)`;
  });
}
