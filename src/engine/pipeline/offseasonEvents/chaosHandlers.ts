/**
 * Chaos offseason events — branching/random outcomes with multiple possible effects.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
} from './types';

/** Handler for the Chaos Rift offseason event — grants XP, fame, and gold from a chaos crystal. */
export function handleChaosRift(
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

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
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
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
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
}

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

/** Handler for the Shadow Tournament offseason event — unsanctioned fights with injury risk. */
export function handleShadowTournament(
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
        const xpGained = 30 + Math.floor(rng.next() * 21);
        const fameGained = 20 + Math.floor(rng.next() * 11);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
          fame: (chosen.fame || 0) + fameGained,
        });
        effectMsg = `${t(e.newsletter[0] || '', { name: chosen.name, xp: xpGained, fame: fameGained })}`;
      } else {
        // Failure
        const fameLost = 10 + Math.floor(rng.next() * 11);
        const newInjury = makeInjury(rng, {
          name: 'Shadow Bruises',
          description: 'A lingering supernatural bruise from the shadow tournament.',
          severity: 'Moderate',
          weeksBase: 3,
          weeksRange: 2,
          penalties: { CN: -1, WL: -1 },
        });
        ctx.rosterUpdates.set(chosen.id, {
          fame: Math.max(0, (chosen.fame || 0) - fameLost),
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = `${t(e.newsletter[1] || '', { name: chosen.name, fame: fameLost })}`;
      }

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [effectMsg],
      });
    }
  }
}

/** Handler for the Chaos Weaver's Game offseason event — gambles warrior traits for rewards. */
export function handleChaosWeaversGame(
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
      if (rng.next() > 0.5) {
        // Win
        const xpGained = 25;
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
        });

        // Manually push the exact narrative line to avoid rng picking the "Lose" line
        // We know e.newsletter[0] is the "Win" line
        const template = e.newsletter[0] || '';
        ctx.newsletterItems.push({
          id: rng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(template, { name: chosen.name, xp: xpGained })],
        });
      } else {
        // Lose
        const newInjury = makeInjury(rng, {
          name: 'Mystic Bruises',
          description: 'A lingering supernatural bruise.',
          severity: 'Minor',
          weeksBase: 2,
          weeksRange: 1,
          penalties: { CN: -1 },
        });
        ctx.rosterUpdates.set(chosen.id, {
          injuries: [...(chosen.injuries || []), newInjury],
        });

        // Manually push the exact narrative line to avoid rng picking the "Win" line
        // We know e.newsletter[1] is the "Lose" line
        const template = e.newsletter[1] || '';
        ctx.newsletterItems.push({
          id: rng.uuid('newsletter'),
          week: nextWeek,
          title: e.title,
          items: [t(template, { name: chosen.name })],
        });
      }
    }
  }
}

/** Handler for the Chaos Weaver Visit offseason event — bestows or removes traits. */
export function handleChaosWeaverVisit(
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
      const positiveTraits = Object.values(TRAITS).filter(
        (td): td is TraitDef => td !== undefined && td.sign === 'positive'
      );
      const grantedTrait = rng.pick(positiveTraits);
      if (grantedTrait) {
        const currentTraits = chosen.traits || [];
        ctx.rosterUpdates.set(chosen.id, {
          traits: [...currentTraits, grantedTrait.id],
        });

        ctx.insightTokens.push(
          makeInsightToken(rng, {
            type: 'Style',
            warriorId: chosen.id,
            warriorName: chosen.name,
            detail: `Touched by the Chaos Weaver — gained ${grantedTrait.name}.`,
            origin: 'Chaos Weaver',
            discoveredWeek: nextWeek,
          })
        );

        pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
          name: chosen.name,
          trait: grantedTrait.name,
        });
      }
    }
  }
}

/** Handler for the Temporal Anomaly offseason event — time distortion affecting warrior age and stats. */
export function handleTemporalAnomaly(
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
      const xpGained = 35;
      const currentTraits = chosen.traits || [];
      const newTraits = [...currentTraits];
      if (newTraits.length > 0) {
        const removedTraitIndex = Math.floor(rng.next() * newTraits.length);
        newTraits.splice(removedTraitIndex, 1);
      }

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        traits: newTraits,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Style',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'The temporal anomaly granted a sudden burst of stylistic intuition.',
          origin: 'Temporal Anomaly',
          discoveredWeek: nextWeek,
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}

/** Handler for the Cursed Treasure Discovery offseason event — gold with a curse side effect. */
export function handleCursedTreasureDiscovery(
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
      const goldGained = 300 + Math.floor(rng.next() * 201);
      const fameLost = 10 + Math.floor(rng.next() * 11);

      ctx.treasuryDelta += goldGained;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Cursed Treasure Gained', goldGained, 'other')
      );

      const newInjury = makeInjury(rng, {
        name: 'Curse of Greed',
        description: 'A lingering mystical sickness from cursed gold.',
        severity: 'Moderate',
        weeksBase: 3,
        weeksRange: 2,
        penalties: { WL: -2, CN: -1 },
      });

      ctx.rosterUpdates.set(chosen.id, {
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: goldGained,
        fame: fameLost,
      });
    }
  }
}

/** Handler for the Chaos Weaver's Prophecy offseason event — foretells a warrior's destiny. */
export function handleChaosWeaversProphecy(
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
      const xpGained = 50;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      const newInjury = makeInjury(rng, {
        name: 'Prophetic Madness',
        description: 'The Chaos Weaver shared a prophecy. The mind reels.',
        severity: 'Minor',
        weeksBase: 2,
        weeksRange: 1,
        penalties: { CN: -1 },
      });

      const currentUpdates = ctx.rosterUpdates.get(chosen.id) || {};
      ctx.rosterUpdates.set(chosen.id, {
        ...currentUpdates,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      const template = e.newsletter[0] || '';
      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(template, { name: chosen.name, xp: xpGained })],
      });
    }
  }
}

/** Handler for the Abyssal Tempest Ritual offseason event — storm ritual granting power at injury risk. */
export function handleAbyssalTempestRitual(
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
      const xpGained = 25;

      const newInjury = makeInjury(rng, {
        name: 'Abyssal Gaze',
        description: 'Stared too deeply into the void.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { SP: -1, CN: -1 },
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

/** Handler for the Unexplained Monolith offseason event — grants XP and fame at injury risk. */
export function handleUnexplainedMonolith(
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
      const fameGained = 10;

      const newInjury = makeInjury(rng, {
        name: 'Monolith Fatigue',
        description: 'Exhausted from touching the unknown.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { SP: -1 },
      });

      const existingUpdate = ctx.rosterUpdates.get(chosen.id) || {};

      const currentXp = existingUpdate.xp ?? chosen.xp ?? 0;
      const currentFame = existingUpdate.fame ?? chosen.fame ?? 0;
      const currentInjuries = existingUpdate.injuries ?? chosen.injuries ?? [];
      const currentTraits = existingUpdate.traits ?? chosen.traits ?? [];

      const newTraits = currentTraits.includes('precise') ? currentTraits : [...currentTraits, 'precise'];

      ctx.rosterUpdates.set(chosen.id, {
        ...existingUpdate,
        xp: currentXp + xpGained,
        fame: currentFame + fameGained,
        injuries: [...currentInjuries, newInjury],
        traits: newTraits,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}

/** Handler for the Suspicious Mushroom Stew offseason event — grants XP but causes a minor stomach injury. */
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
        penalties: { CN: -1, END: -1 },
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
