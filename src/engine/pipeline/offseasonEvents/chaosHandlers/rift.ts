import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  pickActiveWarrior,
  announceOffseasonEvent,
} from '../types';

/** Handler for the Chaos Rift offseason event — grants XP, fame, and gold from a chaos crystal. */
export function handleChaosRift(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const xpGained = 25;
    const fameGained = 15;
    const goldGained = 150;

    ctx.treasuryDelta += goldGained;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Sold Chaos Crystal', goldGained, 'other')
    );

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
      fame: (chosen.fame || 0) + fameGained,
    });

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

    announceOffseasonEvent(ctx, rng, nextWeek, e, {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
    });
  }
}


/** Handler for the Chaotic Spells offseason event — random magical effects on active warriors. */
export function handleChaoticSpells(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const roll = rng.next();
    let effectMsg: string;

    if (roll < 0.33) {
      const xpGained = 10 + Math.floor(rng.next() * 11);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });
      effectMsg = `They feel a surge of unnatural energy! (+${xpGained} XP)`;
    } else if (roll < 0.66) {
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
      effectMsg = 'They sustained mild arcane burns. (Minor Injury)';
    } else {
      const fameLost = 5 + Math.floor(rng.next() * 6);
      ctx.rosterUpdates.set(chosen.id, {
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
      });
      effectMsg = `They were temporarily turned an embarrassing shade of purple. (-${fameLost} Fame)`;
    }

    const baseMsg = t(rng.pick(e.newsletter) || '', { name: chosen.name });
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [`${baseMsg} ${effectMsg}`],
    });
  }
}
