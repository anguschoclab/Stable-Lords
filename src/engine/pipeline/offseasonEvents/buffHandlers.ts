/**
 * Buff offseason events — grant XP, fame, traits, or insights to warriors.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
} from './types';

export function handleFameBoost(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + 25,
    });
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: 25,
    });
  }
}

export function handleEpiphany(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + 10,
      xp: (chosen.xp || 0) + 15,
    });

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Attribute',
        targetKey: 'ST',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden reserve of strength during offseason meditation.',
        origin: 'Epiphany',
        discoveredWeek: nextWeek,
      })
    );

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
    });
  }
}

export function handleBardsSong(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 15 + Math.floor(rng.next() * 20);
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
    });
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: fameGained,
    });
  }
}

export function handleMysticVision(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + 15,
      fame: (chosen.fame || 0) + 10,
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      xp: 15,
      fame: 10,
    });
  }
}

export function handleStrangeDream(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    const xpGained = 5 + Math.floor(rng.next() * 11);

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      xp: xpGained,
    });
  }
}

export function handleMeteorShower(
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
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 6);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

export function handleGladiatorOlympics(
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
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 11);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

export function handleLoyalStrayDog(
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
      const xpGained = 10;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}

export function handleWanderingMystic(
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
      const currentTraits = chosen.traits || [];
      const newTraits = currentTraits.includes('chaos_touched')
        ? currentTraits
        : [...currentTraits, 'chaos_touched'];

      ctx.rosterUpdates.set(chosen.id, {
        traits: newTraits,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
      });
    }
  }
}

export function handleChaosSpores(
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
      const xpGained = 20 + Math.floor(rng.next() * 11);

      const currentTraits = chosen.traits || [];
      const newTraits = currentTraits.includes('spore_kissed')
        ? currentTraits
        : [...currentTraits, 'spore_kissed'];

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        traits: newTraits,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
      });
    }
  }
}

export function handleChaosWeaversGift(
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
      const xpGained = 30;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Tactic',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'A chaotic revelation sparked a new combat tactic.',
          origin: 'Chaos Weaver',
          discoveredWeek: nextWeek,
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
      });
    }
  }
}

export function handleShadowTraining(
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
      const xpGained = 20 + Math.floor(rng.next() * 11);
      const fameLost = 5 + Math.floor(rng.next() * 6);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameLost,
      });
    }
  }
}
