import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
} from '../types';

/** Handler for the Suspicious Mushroom Stew offseason event — grants XP but may cause injury. */
export function handleSuspiciousMushroomStew(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const xpGained = 20 + Math.floor(rng.next() * 16);

      const newInjury = makeInjury(rng, {
        name: 'Stomach Ache',
        description: 'A gnawing ache from eating suspicious glowing mushrooms.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { CN: -1, SP: -1 },
      });

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
      });
    }
  }
}


/** Handler for the Phantom Sparring Partner offseason event — grants XP but adds fatigue. */
export function handlePhantomSparringPartner(
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
      const xpGained = 40;
      const fatigueGained = 10;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fatigue: (chosen.fatigue || 0) + fatigueGained,
      });
      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}


/** Handler for the Dreamweavers Mist offseason event — grants XP but causes a minor magic burn. */
export function handleDreamweaversMist(
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
      const xpGained = 15;
      const newInjury = makeInjury(rng, {
        name: 'Magic Burn',
        description: 'Strange magical blisters that throb in the dark.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { CN: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });
      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}


/** Handler for the Prismatic Gale Exposure offseason event. */
export function handlePrismaticGaleExposure(
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
      const xpGained = 20;

      const newInjury = makeInjury(rng, {
        name: 'Prismatic Dizziness',
        description: 'Still seeing colors and feeling off-balance.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { SP: -1, CN: -1 },
      });

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Style',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'The prismatic winds whispered secrets of movement and flow.',
          discoveredWeek: nextWeek,
          origin: 'Prismatic Gale',
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}
