import type { GameState, LedgerEntry } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import {
  type WarriorId,
  type LedgerEntryId,
  type InsightId,
  type InjuryId,
} from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { NewsletterItem } from '@/types/shared.types';

/**
 * Stable Lords — Seasonal Pipeline Pass (Offseason)
 * The Chaos Weaver 🎲
 */
function t(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && Object.hasOwn(data, key) ? String(value) : match;
  });
}

interface OffseasonEventNarrative {
  title: string;
  effectType:
    | 'fame_boost'
    | 'winter_chill'
    | 'merchant_blessing'
    | 'epiphany'
    | 'tavern_brawl'
    | 'bards_song'
    | 'plague_outbreak'
    | 'black_market_raid'
    | 'grand_feast'
    | 'wandering_healer'
    | 'mystic_vision'
    | 'wild_animal_attack'
    | 'strange_dream'
    | 'street_performance'
    | 'chaotic_spells'
    | 'mysterious_patron'
    | 'loyal_stray'
    | 'midnight_feast'
    | 'shadow_training'
    | 'gladiator_olympics'
    | 'meteor_shower'
    | 'underground_pit_fight'
    | 'rogue_alchemist';
  newsletter: string[];
}

interface OffseasonEventContext {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: NewsletterItem[];
  ledgerEntries: LedgerEntry[];
  insightTokens: InsightToken[];
  treasuryDelta: number;
}

// ─── Shared Handler Helpers ───
// NOTE: each helper preserves the RNG call order of the inlined code it
// replaces (uuid before pick/next), keeping seeded results deterministic.

/** Active warriors, optionally restricted to those carrying no injuries. */
function getActiveWarriors(state: GameState, healthyOnly = false): Warrior[] {
  return state.roster.filter(
    (w) => w.status === 'Active' && (!healthyOnly || !w.injuries || w.injuries.length === 0)
  );
}

/** Builds a minor/random-duration injury. Consumes one uuid then one next(). */
function makeInjury(
  rng: IRNGService,
  params: {
    name: string;
    description: string;
    severity: InjuryData['severity'];
    weeksBase: number;
    weeksRange: number;
    penalties: InjuryData['penalties'];
  }
): InjuryData {
  return {
    id: rng.uuid('injury') as InjuryId,
    name: params.name,
    description: params.description,
    severity: params.severity,
    weeksRemaining: params.weeksBase + Math.floor(rng.next() * params.weeksRange),
    penalties: params.penalties,
  };
}

/** Appends a treasury ledger entry. Consumes one uuid. */
function addLedger(
  ctx: OffseasonEventContext,
  rng: IRNGService,
  nextWeek: number,
  label: string,
  amount: number,
  category: LedgerEntry['category']
): void {
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label,
    amount,
    category,
  });
}

/**
 * Appends a newsletter item using a randomly-picked template line.
 * Consumes one uuid then one pick — matching the inlined object-literal order.
 */
function pushNarrative(
  ctx: OffseasonEventContext,
  rng: IRNGService,
  nextWeek: number,
  e: OffseasonEventNarrative,
  data: Record<string, string | number>
): void {
  const id = rng.uuid('newsletter');
  const template = rng.pick(e.newsletter) || '';
  ctx.newsletterItems.push({
    id,
    week: nextWeek,
    title: e.title,
    items: [t(template, data)],
  });
}

// ─── Individual Offseason Event Handlers ───

function handleFameBoost(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + 25,
    });
    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, fame: 25 });
  }
}

function handleWinterChill(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 150 + Math.floor(rng.next() * 100);
  ctx.treasuryDelta -= cost;
  addLedger(ctx, rng, nextWeek, 'Winter Heating & Supplies', -cost, 'other');
  pushNarrative(ctx, rng, nextWeek, e, { gold: cost });
}

function handleMerchantBlessing(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const gold = 200 + Math.floor(rng.next() * 200);
  ctx.treasuryDelta += gold;
  addLedger(ctx, rng, nextWeek, 'Offseason Sponsorship', gold, 'other');
  pushNarrative(ctx, rng, nextWeek, e, { gold });
}

function handleEpiphany(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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
      discoveredWeek: nextWeek,
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name });
  }
}

function handleTavernBrawl(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 10 + Math.floor(rng.next() * 11);

    const newInjury = makeInjury(rng, {
      name: 'Bruised Ribs',
      description: 'Painful but manageable.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { CN: -1 },
    });

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, fame: fameGained });
  }
}

function handleBardsSong(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 15 + Math.floor(rng.next() * 20);
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
    });
    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, fame: fameGained });
  }
}

function handlePlagueOutbreak(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameLost = 5 + Math.floor(rng.next() * 10);

    const newInjury = makeInjury(rng, {
      name: 'Camp Fever',
      description: 'Leaves the victim weak and fatigued.',
      severity: 'Minor',
      weeksBase: 2,
      weeksRange: 2,
      penalties: { CN: -2, ST: -1 },
    });

    ctx.rosterUpdates.set(chosen.id, {
      fame: Math.max(0, (chosen.fame || 0) - fameLost),
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, fame: fameLost });
  }
}

function handleBlackMarketRaid(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  const goldLost = 50 + Math.floor(rng.next() * 101);
  ctx.treasuryDelta -= goldLost;
  addLedger(ctx, rng, nextWeek, 'Black Market Fines', -goldLost, 'other');

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  pushNarrative(ctx, rng, nextWeek, e, {
    name: chosen ? chosen.name : 'Someone',
    gold: goldLost,
  });
}

function handleGrandFeast(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const goldCost = 200 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta -= goldCost;
  addLedger(ctx, rng, nextWeek, 'Grand Feast Expenses', -goldCost, 'other');

  const activeWarriors = getActiveWarriors(state);
  for (const w of activeWarriors) {
    ctx.rosterUpdates.set(w.id, {
      xp: (w.xp || 0) + 10,
    });
  }

  pushNarrative(ctx, rng, nextWeek, e, { gold: goldCost });
}

function handleWanderingHealer(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const goldCost = 50 + Math.floor(rng.next() * 51);
  ctx.treasuryDelta -= goldCost;
  addLedger(ctx, rng, nextWeek, 'Medical Tonics', -goldCost, 'medical');

  const activeInjured = state.roster.filter(
    (w) => w.status === 'Active' && w.injuries && w.injuries.length > 0
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

function handleMysticVision(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + 15,
      fame: (chosen.fame || 0) + 10,
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, xp: 15, fame: 10 });
  }
}

function handleWildAnimalAttack(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state, true);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 5 + Math.floor(rng.next() * 6);

    const newInjury = makeInjury(rng, {
      name: 'Bite Wound',
      description: 'A nasty bite from a wild beast.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { CN: -1 },
    });

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, fame: fameGained });
  }
}

function handleStrangeDream(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    const xpGained = 5 + Math.floor(rng.next() * 11);

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
    });

    pushNarrative(ctx, rng, nextWeek, e, { name: chosen.name, xp: xpGained });
  }
}

function handleLoyalStray(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 25;
  ctx.treasuryDelta -= cost;
  addLedger(ctx, rng, nextWeek, 'Dog Food & Treats', -cost, 'other');

  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + 10,
        fame: (chosen.fame || 0) + 5,
      });

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        xp: 10,
        fame: 5,
        gold: cost,
      });
    }
  }
}

function handleStreetPerformance(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = 15;
      const goldGained = 50 + Math.floor(rng.next() * 50);
      ctx.treasuryDelta += goldGained;

      addLedger(ctx, rng, nextWeek, 'Street Performance Tips', goldGained, 'other');

      const currentFlair = chosen.flair || [];
      const newFlair = currentFlair.includes('Local Hero')
        ? currentFlair
        : [...currentFlair, 'Local Hero'];

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        flair: newFlair,
      });

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        fame: fameGained,
        gold: goldGained,
      });
    }
  }
}

function handleChaoticSpells(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

function handleMysteriousPatron(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const goldGained = 100 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta += goldGained;

  addLedger(ctx, rng, nextWeek, 'Mysterious Patron Donation', goldGained, 'other');

  pushNarrative(ctx, rng, nextWeek, e, { gold: goldGained });
}

function handleMidnightFeast(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 40 + Math.floor(rng.next() * 61);
  ctx.treasuryDelta -= cost;

  addLedger(ctx, rng, nextWeek, 'Midnight Feast Tab', -cost, 'other');

  const activeWarriors = getActiveWarriors(state);
  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  if (chosen) {
    const xpGained = 15;
    const fameGained = 10;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
      fame: (chosen.fame || 0) + fameGained,
    });

    pushNarrative(ctx, rng, nextWeek, e, {
      name: chosen.name,
      xp: xpGained,
      fame: fameGained,
      gold: cost,
    });
  } else {
    pushNarrative(ctx, rng, nextWeek, e, { name: 'Someone', xp: 0, fame: 0, gold: cost });
  }
}

function handleShadowTraining(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        xp: xpGained,
        fame: fameLost,
      });
    }
  }
}

function handleGladiatorOlympics(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

function handleUndergroundPitFight(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = getActiveWarriors(state);
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = 15 + Math.floor(rng.next() * 16);

      const newInjury = makeInjury(rng, {
        name: 'Busted Knuckles',
        description: 'A messy wound from a bare-knuckle pit fight.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 3,
        penalties: { SP: -1, CN: -1 },
      });

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        fame: fameGained,
      });
    }
  }
}

function handleAbyssalBargain(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

function handleRogueAlchemist(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

function handleMeteorShower(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
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

      pushNarrative(ctx, rng, nextWeek, e, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

const EVENT_HANDLERS: Record<
  string,
  (
    state: GameState,
    nextWeek: number,
    e: OffseasonEventNarrative,
    rng: IRNGService,
    ctx: OffseasonEventContext
  ) => void
> = {
  fame_boost: handleFameBoost,
  winter_chill: handleWinterChill,
  merchant_blessing: handleMerchantBlessing,
  epiphany: handleEpiphany,
  tavern_brawl: handleTavernBrawl,
  bards_song: handleBardsSong,
  plague_outbreak: handlePlagueOutbreak,
  black_market_raid: handleBlackMarketRaid,
  grand_feast: handleGrandFeast,
  wandering_healer: handleWanderingHealer,
  mystic_vision: handleMysticVision,
  wild_animal_attack: handleWildAnimalAttack,
  strange_dream: handleStrangeDream,
  loyal_stray: handleLoyalStray,
  street_performance: handleStreetPerformance,
  chaotic_spells: handleChaoticSpells,
  mysterious_patron: handleMysteriousPatron,
  midnight_feast: handleMidnightFeast,
  shadow_training: handleShadowTraining,
  gladiator_olympics: handleGladiatorOlympics,
  underground_pit_fight: handleUndergroundPitFight,
  meteor_shower: handleMeteorShower,
  rogue_alchemist: handleRogueAlchemist,
  abyssal_bargain: handleAbyssalBargain,
};

export function runSeasonalPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  // Only trigger on the transition to week 1 (off-season)
  if (nextWeek !== 1) {
    return {};
  }

  const seasonRng = rootRng || new SeededRNGService(state.year * 999 + 1);

  // Safe cast for our dynamic offseason data
  const events = (
    narrativeContent as unknown as { offseason_events: Record<string, OffseasonEventNarrative> }
  ).offseason_events;

  if (!events) {
    return {};
  }

  const eventKeys = Object.keys(events);
  if (eventKeys.length === 0) return {};

  const chosenEventKey = seasonRng.pick(eventKeys);
  if (!chosenEventKey) return {};
  const e = events[chosenEventKey];
  if (!e) return {};

  const ctx: OffseasonEventContext = {
    rosterUpdates: new Map<WarriorId, Partial<Warrior>>(),
    newsletterItems: [],
    ledgerEntries: [],
    insightTokens: [],
    treasuryDelta: 0,
  };

  const handler = EVENT_HANDLERS[e.effectType];
  if (handler) {
    handler(state, nextWeek, e, seasonRng, ctx);
  }

  const impact: StateImpact = {
    rosterUpdates: ctx.rosterUpdates,
    newsletterItems: ctx.newsletterItems,
    ...(ctx.ledgerEntries.length > 0 ? { ledgerEntries: ctx.ledgerEntries } : {}),
    ...(ctx.treasuryDelta !== 0 ? { treasuryDelta: ctx.treasuryDelta } : {}),
    ...(ctx.insightTokens.length > 0 ? { insightTokens: ctx.insightTokens } : {}),
  };

  return impact;
}
