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
    | 'underground_pit_fight';
  newsletter: string[];
}

interface OffseasonEventContext {
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: any[];
  ledgerEntries: LedgerEntry[];
  insightTokens: InsightToken[];
  treasuryDelta: number;
}

// ─── Individual Offseason Event Handlers ───

function handleFameBoost(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + 25,
    });
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, fame: 25 })],
    });
  }
}

function handleWinterChill(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 150 + Math.floor(rng.next() * 100);
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Winter Heating & Supplies',
    amount: -cost,
    category: 'other',
  });
  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [t(rng.pick(e.newsletter) || '', { gold: cost })],
  });
}

function handleMerchantBlessing(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const gold = 200 + Math.floor(rng.next() * 200);
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Offseason Sponsorship',
    amount: gold,
    category: 'other',
  });
  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [t(rng.pick(e.newsletter) || '', { gold })],
  });
}

function handleEpiphany(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
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

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name })],
    });
  }
}

function handleTavernBrawl(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter(
    (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
  );
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 10 + Math.floor(rng.next() * 11);

    const newInjury: InjuryData = {
      id: rng.uuid('injury') as InjuryId,
      name: 'Bruised Ribs',
      description: 'Painful but manageable.',
      severity: 'Minor',
      weeksRemaining: 1 + Math.floor(rng.next() * 2),
      penalties: { CN: -1 },
    };

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, fame: fameGained })],
    });
  }
}

function handleBardsSong(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 15 + Math.floor(rng.next() * 20);
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
    });
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, fame: fameGained })],
    });
  }
}

function handlePlagueOutbreak(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter(
    (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
  );
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameLost = 5 + Math.floor(rng.next() * 10);

    const newInjury: InjuryData = {
      id: rng.uuid('injury') as InjuryId,
      name: 'Camp Fever',
      description: 'Leaves the victim weak and fatigued.',
      severity: 'Minor',
      weeksRemaining: 2 + Math.floor(rng.next() * 2),
      penalties: { CN: -2, ST: -1 },
    };

    ctx.rosterUpdates.set(chosen.id, {
      fame: Math.max(0, (chosen.fame || 0) - fameLost),
      injuries: [...(chosen.injuries || []), newInjury],
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, fame: fameLost })],
    });
  }
}

function handleBlackMarketRaid(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  const goldLost = 50 + Math.floor(rng.next() * 101);
  ctx.treasuryDelta -= goldLost;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Black Market Fines',
    amount: -goldLost,
    category: 'other',
  });

  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [t(rng.pick(e.newsletter) || '', { name: chosen ? chosen.name : 'Someone', gold: goldLost })],
  });
}

function handleGrandFeast(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const goldCost = 200 + Math.floor(rng.next() * 201);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Grand Feast Expenses',
    amount: -goldCost,
    category: 'other',
  });

  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  for (const w of activeWarriors) {
    ctx.rosterUpdates.set(w.id, {
      xp: (w.xp || 0) + 10,
    });
  }

  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [t(rng.pick(e.newsletter) || '', { gold: goldCost })],
  });
}

function handleWanderingHealer(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const goldCost = 50 + Math.floor(rng.next() * 51);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Medical Tonics',
    amount: -goldCost,
    category: 'medical',
  });

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
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + 15,
      fame: (chosen.fame || 0) + 10,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, xp: 15, fame: 10 })],
    });
  }
}

function handleWildAnimalAttack(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter(
    (w) => w.status === 'Active' && (!w.injuries || w.injuries.length === 0)
  );
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;
    const fameGained = 5 + Math.floor(rng.next() * 6);

    const newInjury: InjuryData = {
      id: rng.uuid('injury') as InjuryId,
      name: 'Bite Wound',
      description: 'A nasty bite from a wild beast.',
      severity: 'Minor',
      weeksRemaining: 1 + Math.floor(rng.next() * 2),
      penalties: { CN: -1 },
    };

    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, fame: fameGained })],
    });
  }
}

function handleStrangeDream(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (!chosen) return;

    const xpGained = 5 + Math.floor(rng.next() * 11);

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(rng.pick(e.newsletter) || '', { name: chosen.name, xp: xpGained })],
    });
  }
}

function handleLoyalStray(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 25;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Dog Food & Treats',
    amount: -cost,
    category: 'other',
  });

  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + 10,
        fame: (chosen.fame || 0) + 5,
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            xp: 10,
            fame: 5,
            gold: cost,
          }),
        ],
      });
    }
  }
}

function handleStreetPerformance(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = 15;
      const goldGained = 50 + Math.floor(rng.next() * 50);
      ctx.treasuryDelta += goldGained;

      ctx.ledgerEntries.push({
        id: rng.uuid('ledger') as LedgerEntryId,
        week: nextWeek,
        label: 'Street Performance Tips',
        amount: goldGained,
        category: 'other',
      });

      const currentFlair = chosen.flair || [];
      const newFlair = currentFlair.includes('Local Hero')
        ? currentFlair
        : [...currentFlair, 'Local Hero'];

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        flair: newFlair,
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            fame: fameGained,
            gold: goldGained,
          }),
        ],
      });
    }
  }
}

function handleChaoticSpells(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const roll = rng.next();
      let effectMsg = '';

      if (roll < 0.33) {
        const xpGained = 10 + Math.floor(rng.next() * 11);
        ctx.rosterUpdates.set(chosen.id, {
          xp: (chosen.xp || 0) + xpGained,
        });
        effectMsg = `They feel a surge of unnatural energy! (+${xpGained} XP)`;
      } else if (roll < 0.66) {
        const newInjury: InjuryData = {
          id: rng.uuid('injury') as InjuryId,
          name: 'Arcane Burns',
          description: 'Singed by erratic magic.',
          severity: 'Minor',
          weeksRemaining: 1 + Math.floor(rng.next() * 2),
          penalties: { SP: -1, CN: -1 },
        };
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

  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Mysterious Patron Donation',
    amount: goldGained,
    category: 'other',
  });

  ctx.newsletterItems.push({
    id: rng.uuid('newsletter'),
    week: nextWeek,
    title: e.title,
    items: [t(rng.pick(e.newsletter) || '', { gold: goldGained })],
  });
}

function handleMidnightFeast(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const cost = 40 + Math.floor(rng.next() * 61);
  ctx.treasuryDelta -= cost;

  ctx.ledgerEntries.push({
    id: rng.uuid('ledger') as LedgerEntryId,
    week: nextWeek,
    label: 'Midnight Feast Tab',
    amount: -cost,
    category: 'other',
  });

  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  const chosen = activeWarriors.length > 0 ? rng.pick(activeWarriors) : null;
  if (chosen) {
    const xpGained = 15;
    const fameGained = 10;

    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
      fame: (chosen.fame || 0) + fameGained,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [
        t(rng.pick(e.newsletter) || '', {
          name: chosen.name,
          xp: xpGained,
          fame: fameGained,
          gold: cost,
        }),
      ],
    });
  } else {
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [
        t(rng.pick(e.newsletter) || '', { name: 'Someone', xp: 0, fame: 0, gold: cost }),
      ],
    });
  }
}

function handleShadowTraining(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const xpGained = 20 + Math.floor(rng.next() * 11);
      const fameLost = 5 + Math.floor(rng.next() * 6);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            xp: xpGained,
            fame: fameLost,
          }),
        ],
      });
    }
  }
}

function handleGladiatorOlympics(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 11);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            xp: xpGained,
            fame: fameGained,
          }),
        ],
      });
    }
  }
}

function handleUndergroundPitFight(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const fameGained = 15 + Math.floor(rng.next() * 16);

      const newInjury: InjuryData = {
        id: rng.uuid('injury') as InjuryId,
        name: 'Busted Knuckles',
        description: 'A messy wound from a bare-knuckle pit fight.',
        severity: 'Minor',
        weeksRemaining: 1 + Math.floor(rng.next() * 3),
        penalties: { SP: -1, CN: -1 },
      };

      ctx.rosterUpdates.set(chosen.id, {
        fame: (chosen.fame || 0) + fameGained,
        injuries: [...(chosen.injuries || []), newInjury],
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            fame: fameGained,
          }),
        ],
      });
    }
  }
}

function handleMeteorShower(state: GameState, nextWeek: number, e: OffseasonEventNarrative, rng: IRNGService, ctx: OffseasonEventContext) {
  const activeWarriors = state.roster.filter((w) => w.status === 'Active');
  if (activeWarriors.length > 0) {
    const chosen = rng.pick(activeWarriors);
    if (chosen) {
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 6);

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });

      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [
          t(rng.pick(e.newsletter) || '', {
            name: chosen.name,
            xp: xpGained,
            fame: fameGained,
          }),
        ],
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
