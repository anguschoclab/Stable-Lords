/**
 * Seasonal Event Handlers — Individual Offseason Event Implementations
 * Extracted from seasonal.ts for SRP separation.
 * Each handler processes one offseason event type.
 */
import type { GameState, LedgerEntry } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  type WarriorId,
  type LedgerEntryId,
  type InsightId,
  type InjuryId,
} from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { NewsletterItem } from '@/types/shared.types';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { pushNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import { isActive } from '@/engine/warriorStatus';

export interface OffseasonEventNarrative {
  title: string;
  effectType:
    | 'chaos_rift'
    | 'chaotic_weather_experiment'
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
    | 'rogue_alchemist'
    | 'tavern_brawl_surprise'
    | 'chaos_spores'
    | 'dreamweaver_visit'
    | 'abyssal_bargain'
    | 'goblin_raid'
    | 'fey_trickster'
    | 'shadow_tournament'
    | 'wandering_fortune_teller'
    | 'chaos_weaver_visit'
    | 'traveling_circus'
    | 'bounty_hunter_visit'
    | 'loyal_stray_dog'
    | 'midnight_market'
    | 'shadow_market_run'
    | 'moonlight_duel'
    | 'chaos_weavers_game'
    | 'secret_fight_club'
    | 'chaos_weavers_gift'
    | 'temporal_anomaly'
    | 'wandering_mystic';
  newsletter: string[];
}

export interface OffseasonEventContext {
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
    (w) => isActive(w) && (!healthyOnly || !w.injuries || w.injuries.length === 0)
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

// ─── Individual Offseason Event Handlers ───

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
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Sold Chaos Crystal', goldGained, 'other'));

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Style' as InsightToken['type'],
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Touched the raw essence of the Chaos Rift.',
        origin: 'Chaos Rift',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}

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
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, fame: 25 });
  }
}

export function handleWinterChill(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const cost = 150 + Math.floor(rng.next() * 100);
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Winter Heating & Supplies', -cost, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: cost });
}

export function handleMerchantBlessing(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const gold = 200 + Math.floor(rng.next() * 200);
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Offseason Sponsorship', gold, 'other'));
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold });
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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name });
  }
}

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
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Shadow Market Excursion', -cost, 'other'));

      const fameGained = 15;
      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
      });

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden technique at the Shadow Market.',
        origin: 'Shadow Market',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
        fame: fameGained,
      });
    }
  }
}

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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, fame: fameGained });
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
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, fame: fameGained });
  }
}

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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, fame: fameLost });
  }
}

export function handleBlackMarketRaid(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const activeWarriors = getActiveWarriors(state);
  const goldLost = 50 + Math.floor(rng.next() * 101);
  ctx.treasuryDelta -= goldLost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Black Market Fines', -goldLost, 'other'));

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
    name: chosen ? chosen.name : 'Someone',
    gold: goldLost,
  });
}

export function handleGrandFeast(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldCost = 200 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Grand Feast Expenses', -goldCost, 'other'));

  const activeWarriors = getActiveWarriors(state);
  for (const w of activeWarriors) {
    ctx.rosterUpdates.set(w.id, {
      xp: (w.xp || 0) + 10,
    });
  }

  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: goldCost });
}

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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, xp: 15, fame: 10 });
  }
}

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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, fame: fameGained });
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

    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: chosen.name, xp: xpGained });
  }
}

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

      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Street Performance Tips', goldGained, 'other'));

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

export function handleMysteriousPatron(
  _state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  const goldGained = 100 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta += goldGained;

  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Mysterious Patron Donation', goldGained, 'other'));

  pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { gold: goldGained });
}

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
    pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, { name: 'Someone', xp: 0, fame: 0, gold: cost });
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

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        fame: fameGained,
      });
    }
  }
}

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
      const fameGained = 15 + Math.floor(rng.next() * 11);

      const newInjury = makeInjury(rng, {
        name: 'Tavern Bruises',
        description: 'Scrapes and bruises from a sudden tavern brawl.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { SP: -1 },
      });

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
        ctx.insightTokens.push({
          id: rng.uuid('insight') as InsightId,
          type: 'Style' as InsightToken['type'],
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: 'A fey trickster taught them an impossible maneuver.',
          origin: 'Fey Trickster',
          discoveredWeek: nextWeek,
        });
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

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden rhythm in their fighting style.',
        origin: 'Wandering Fortune Teller',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
      });
    }
  }
}

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
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Traveling Circus Distraction', -cost, 'other'));

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

        ctx.insightTokens.push({
          id: rng.uuid('insight') as InsightId,
          type: 'Style' as InsightToken['type'],
          warriorId: chosen.id,
          warriorName: chosen.name,
          detail: `Touched by the Chaos Weaver — gained ${grantedTrait.name}.`,
          origin: 'Chaos Weaver',
          discoveredWeek: nextWeek,
        });

        pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
          name: chosen.name,
          trait: grantedTrait.name,
        });
      }
    }
  }
}

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
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Bounty Information Payout', goldGained, 'other'));

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
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Midnight Market Elixirs', -cost, 'other'));

      const xpGained = 20;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Tactic',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Whispers from the Midnight Market revealed a new tactic.',
        origin: 'Midnight Market',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        gold: cost,
      });
    }
  }
}


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

export function handleSecretFightClub(
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
      const newInjury = makeInjury(rng, {
        name: 'Brawler Bruises',
        description: 'Bruises from an unsanctioned underground brawl.',
        severity: 'Minor',
        weeksBase: 2,
        weeksRange: 2,
        penalties: { SP: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });
      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
        fame: fameGained,
      });
    }
  }
}


export function handleChaoticWeatherExperiment(
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
      const xpGained = 15 + Math.floor(rng.next() * 10);
      const newInjury = makeInjury(rng, {
        name: 'Magic Burns',
        description: 'Minor burns from a wild weather experiment gone wrong.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { SP: -1 },
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

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Tactic',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'A chaotic revelation sparked a new combat tactic.',
        origin: 'Chaos Weaver',
        discoveredWeek: nextWeek,
      });

      pushNewsletterItem(ctx.newsletterItems, rng, nextWeek, e.title, e.newsletter, {
        name: chosen.name,
        xp: xpGained,
      });
    }
  }
}

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

      ctx.insightTokens.push({
        id: rng.uuid('insight') as InsightId,
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'The temporal anomaly granted a sudden burst of stylistic intuition.',
        origin: 'Temporal Anomaly',
        discoveredWeek: nextWeek,
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

