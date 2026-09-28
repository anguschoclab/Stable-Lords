import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
} from '../types';

/** Handler for the Abyssal Bargain offseason event — trades gold for warrior power at a cost. */
export function handleAbyssalBargain(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const roll = rng.next();
      let effectMsg: string;

      if (roll < 0.6) {
        // They accept the bargain
        const xpGained = 40 + Math.floor(rng.next() * 21);
        const fameLost = 15 + Math.floor(rng.next() * 11);
        const newInjury = makeInjury(rng, {
          name: 'Soul Rot',
          description: 'A lingering supernatural curse.',
          severity: 'Moderate',
          weeksBase: 3,
          weeksRange: 2,
          penalties: { CN: -2, WL: -2 },
        });

        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
          fame: Math.max(0, (chosen.fame || 0) - fameLost),
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = `They accepted the bargain. Power surges within them, but their soul feels tarnished. (+${xpGained} XP, -${fameLost} Fame, Moderate Injury)`;
      } else {
        // They refuse
        const fameGained = 15 + Math.floor(rng.next() * 11);
        ctx.rosterUpdates.set(chosen.id, {
          fame: (chosen.fame || 0) + fameGained,
        });
        effectMsg = `They bravely refused the shadowed figure! The town applauds their moral fortitude. (+${fameGained} Fame)`;
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
}


/** Handler for the Fey Trickster offseason event — random boon or bane from a fey visitor. */
export function handleFeyTrickster(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const roll = rng.next();
      let effectMsg: string;

      if (roll < 0.6) {
        // Solved riddle
        const xpGained = 20 + Math.floor(rng.next() * 16);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
        });
        ctx.insightTokens.push(
          makeInsightToken(rng, {
            type: 'Style',
            warriorId: chosen.id,
            warriorName: chosen.name,
            detail: 'A fey trickster taught them an impossible maneuver.',
            origin: 'Fey Trickster',
            discoveredWeek: nextWeek,
          })
        );
        effectMsg = `They solved the riddle! They gain strange insights. (+${xpGained} XP, Insight Gained)`;
      } else {
        // Tricked
        const newInjury = makeInjury(rng, {
          name: 'Fey Prank',
          description: 'A deeply embarrassing magical prank.',
          severity: 'Minor',
          weeksBase: 1,
          weeksRange: 1,
          penalties: { WL: -1, SP: -1 },
        });
        ctx.rosterUpdates.set(chosen.id, {
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = `They were made a fool of, suffering minor hexes. (Minor Injury)`;
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
}


/** Handler for the Rogue Alchemist offseason event — offers experimental potions with side effects. */
export function handleRogueAlchemist(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const roll = rng.next();
      let effectMsg: string;

      if (roll < 0.5) {
        // Success
        const xpGained = 20 + Math.floor(rng.next() * 11);
        const fameGained = 5 + Math.floor(rng.next() * 6);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
          fame: (chosen.fame || 0) + fameGained,
        });
        effectMsg = `It was a mutagenic success! They feel incredibly powerful. (+${xpGained} XP, +${fameGained} Fame)`;
      } else {
        // Failure
        const newInjury = makeInjury(rng, {
          name: 'Alchemical Sickness',
          description: 'Nausea, cold sweats, and strange bodily humming.',
          severity: 'Minor',
          weeksBase: 1,
          weeksRange: 2,
          penalties: { SP: -1, CN: -1 },
        });
        ctx.rosterUpdates.set(chosen.id, {
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = `It tasted like battery acid. They are violently ill. (Minor Injury)`;
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
}
