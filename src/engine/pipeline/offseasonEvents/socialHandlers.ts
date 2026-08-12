/**
 * Social offseason events — mixed gold and warrior effects from social activities.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { type LedgerEntryId } from '@/types/shared.types';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  getActiveWarriors,
} from './types';
import { isActive } from '@/engine/warriorStatus';

/**
 *
 */
export function handleShadowMarketRun(
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
      const cost = 25 + Math.floor(rng.next() * 26);
      ctx.treasuryDelta -= cost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Shadow Market Excursion', -cost, 'other')
      );

      const fameGained = 15;
      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Style',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'Discovered a hidden technique at the Shadow Market.',
          origin: 'Shadow Market',
          discoveredWeek: nextWeek,
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
        fame: fameGained,
      });
    }
  }
}

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

  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: goldCost });
}

/**
 *
 */
export function handleWanderingHealer(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldCost = 50 + Math.floor(rng.next() * 51);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Medical Tonics', -goldCost, 'upkeep'));

  const activeInjured = state.roster.filter(
    (w) => isActive(w) && w.injuries && w.injuries.length > 0
  );

  const chosen = activeInjured.length > 0 ? rng.pick(activeInjured) : null;
  if (chosen) {
    const remainingInjuries = [...(chosen.injuries || [])];
    if (remainingInjuries.length > 0) {
      const injuryIndex = Math.floor(rng.next() * remainingInjuries.length);
      remainingInjuries.splice(injuryIndex, 1);
    }
    ctx.rosterUpdates.set(chosen.id, {
      injuries: remainingInjuries,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[1] || '', { name: chosen.name, gold: goldCost })],
    });
  } else {
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[0] || '', { gold: goldCost })],
    });
  }
}

/**
 *
 */
export function handleLoyalStray(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 25;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Dog Food & Treats', -cost, 'other'));

  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + 10,
        fame: (chosen.fame || 0) + 5,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: 10,
        fame: 5,
        gold: cost,
      });
    }
  }
}

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
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
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

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        fame: fameGained,
        gold: goldGained,
      });
    }
  }
}

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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
      gold: cost,
    });
  } else {
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
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
export function handleTravelingCircus(
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

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

/**
 *
 */
export function handleBountyHunterVisit(
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
      const goldGained = 150 + Math.floor(rng.next() * 101);
      ctx.treasuryDelta += goldGained;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Bounty Information Payout', goldGained, 'other')
      );

      const fameGained = 10;
      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: goldGained,
        fame: fameGained,
      });
    }
  }
}

/**
 *
 */
export function handleMidnightMarket(
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
      const cost = 40;
      ctx.treasuryDelta -= cost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Midnight Market Elixirs', -cost, 'other')
      );

      const xpGained = 20;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Tactic',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'Whispers from the Midnight Market revealed a new tactic.',
          origin: 'Midnight Market',
          discoveredWeek: nextWeek,
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
      });
    }
  }
}

/**
 *
 */
export function handleWanderingFortuneTeller(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 30;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Fortune Teller Reading', -cost, 'other'));

  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const xpGained = 15;

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Style',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'Discovered a hidden rhythm in their fighting style.',
          origin: 'Wandering Fortune Teller',
          discoveredWeek: nextWeek,
        })
      );

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
      });
    }
  }
}

/**
 *
 */
export function handleMoonlightDuel(
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
      const gold = 150 + Math.floor(rng.next() * 150);
      ctx.treasuryDelta += gold;

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold,
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
}

/**
 *
 */
export function handleDreamweaverVisit(
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

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push(
        makeInsightToken(rng, {
          type: 'Style',
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'Dreamweaver vision revealed hidden stylistic knowledge.',
          origin: 'Dreamweaver',
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
