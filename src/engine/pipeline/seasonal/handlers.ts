import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { InsightId } from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { rollRange } from '@/engine/core/rng/rollRange';
import { createOffseasonInjury } from '@/engine/injuries';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { getActiveWarriors } from './helpers';
import type { OffseasonEventNarrative, OffseasonEventContext } from './types';

/**
 *
 */
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

/**
 *
 */
export function handleWinterChill(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = rollRange(rng, 150, 100);
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(
    makeLedgerEntry(rng, nextWeek, 'Winter Heating & Supplies', -cost, 'other')
  );
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: cost });
}

/**
 *
 */
export function handleMerchantBlessing(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const gold = rollRange(rng, 200, 200);
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Offseason Sponsorship', gold, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold });
}

/**
 *
 */
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

    ctx.insightTokens.push({
      id: rng.uuid('insight') as InsightId,
      type: 'Attribute',
      targetKey: 'ST',
      warriorId: chosen.id,
      warriorName: chosen.name,
      detail: 'Discovered a hidden reserve of strength during offseason meditation.',
      origin: 'Epiphany',
      discoveredWeek: nextWeek,
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
    });
  }
}

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
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = rollRange(rng, 10, 11);

    const newInjury = createOffseasonInjury(rng, 'bruisedRibs');

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: fameGained,
    });
  }
}

/**
 *
 */
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
    const fameGained = rollRange(rng, 15, 20);
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
    });
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: fameGained,
    });
  }
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
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameLost = rollRange(rng, 5, 10);

    const newInjury = createOffseasonInjury(rng, 'campFever');

    ctx.rosterUpdates.set(chosen.id, {
      fame: Math.max(0, (chosen.fame || 0) - fameLost),
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: fameLost,
    });
  }
}

/**
 *
 */
export function handleBlackMarketRaid(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  const goldLost = rollRange(rng, 50, 101);
  ctx.treasuryDelta -= goldLost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Black Market Fines', -goldLost, 'other'));

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
    name: chosen ? chosen.name : 'Someone',
    gold: goldLost,
  });
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
  const goldCost = rollRange(rng, 200, 201);
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
  const goldCost = rollRange(rng, 50, 51);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Medical Tonics', -goldCost, 'upkeep'));

  const activeInjured = state.roster.filter(
    (w) => w.status === 'Active' && w.injuries && w.injuries.length > 0
  );

  const chosen = activeInjured.length > 0 ? rng.pick(activeInjured) : null;
  if (chosen) {
    const remainingInjuries = [...(chosen.injuries || [])];
    if (remainingInjuries.length > 0) {
      const injuryIndex = rollRange(rng, 0, remainingInjuries.length);
      remainingInjuries.splice(injuryIndex, 1);
    }
    ctx.rosterUpdates.set(chosen.id, {
      injuries: remainingInjuries,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[0] || '', { name: chosen.name, gold: goldCost })],
    });
  } else {
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[1] || '', { gold: goldCost })],
    });
  }
}

/**
 *
 */
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
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = rollRange(rng, 5, 6);

    const newInjury = createOffseasonInjury(rng, 'biteWound');

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      fame: fameGained,
    });
  }
}

/**
 *
 */
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

    const xpGained = rollRange(rng, 5, 11);

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
    });

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
      name: chosen.name,
      xp: xpGained,
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
      const goldGained = rollRange(rng, 50, 50);
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
        const xpGained = rollRange(rng, 10, 11);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
        });
        effectMsg = `They feel a surge of unnatural energy! (+${xpGained} XP)`;
      } else if (roll < 0.66) {
        const newInjury = createOffseasonInjury(rng, 'arcaneBurns');
        ctx.rosterUpdates.set(chosen.id, {
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = 'They sustained mild arcane burns. (Minor Injury)';
      } else {
        const fameLost = rollRange(rng, 5, 6);
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

/**
 *
 */
export function handleMysteriousPatron(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldGained = rollRange(rng, 100, 201);
  ctx.treasuryDelta += goldGained;

  ctx.ledgerEntries.push(
    makeLedgerEntry(rng, nextWeek, 'Mysterious Patron Donation', goldGained, 'other')
  );

  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
    gold: goldGained,
  });
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
  const cost = rollRange(rng, 40, 61);
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
      const xpGained = rollRange(rng, 20, 11);
      const fameLost = rollRange(rng, 5, 6);

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

/**
 *
 */
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
      const xpGained = rollRange(rng, 15, 11);
      const fameGained = rollRange(rng, 10, 11);

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
export function handleGoblinRaid(
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
      const goldLost = rollRange(rng, 20, 31);
      ctx.treasuryDelta -= goldLost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Goblin Raid Loss', -goldLost, 'other')
      );

      const newInjury = createOffseasonInjury(rng, 'goblinScratch');

      ctx.rosterUpdates.set(chosen.id, {
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: goldLost,
      });
    }
  }
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
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = rollRange(rng, 15, 16);

      const newInjury = createOffseasonInjury(rng, 'bustedKnuckles');

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        fame: fameGained,
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
      const xpGained = rollRange(rng, 15, 11);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Style' as InsightToken['type'],
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Dreamweaver vision revealed hidden stylistic knowledge.',
        origin: 'Dreamweaver',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
      });
    }
  }
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
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = rollRange(rng, 15, 11);

      const newInjury = createOffseasonInjury(rng, 'tavernBruises');

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        fame: fameGained,
      });
    }
  }
}

/**
 *
 */
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
        const xpGained = rollRange(rng, 40, 21);
        const fameLost = rollRange(rng, 15, 11);
        const newInjury = createOffseasonInjury(rng, 'soulRot');

        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
          fame: Math.max(0, (chosen.fame || 0) - fameLost),
          injuries: [...(chosen.injuries || []), newInjury],
        });
        effectMsg = `They accepted the bargain. Power surges within them, but their soul feels tarnished. (+${xpGained} XP, -${fameLost} Fame, Moderate Injury)`;
      } else {
        // They refuse
        const fameGained = rollRange(rng, 15, 11);
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

/**
 *
 */
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
        const xpGained = rollRange(rng, 20, 11);
        const fameGained = rollRange(rng, 5, 6);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
          fame: (chosen.fame || 0) + fameGained,
        });
        effectMsg = `It was a mutagenic success! They feel incredibly powerful. (+${xpGained} XP, +${fameGained} Fame)`;
      } else {
        // Failure
        const newInjury = createOffseasonInjury(rng, 'alchemicalSickness');
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

/**
 *
 */
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
      const xpGained = rollRange(rng, 15, 11);
      const fameGained = rollRange(rng, 10, 6);

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
