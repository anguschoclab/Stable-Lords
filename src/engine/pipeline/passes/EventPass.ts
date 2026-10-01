import type { GameState, NewsletterItem, LedgerEntry } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { narrativeContent } from '@/data/narrative';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId, type InjuryId } from '@/types/shared.types';
import type { EventNarrative } from '@/types/narrative.types';
import { rollRange } from '@/engine/core/rng/rollRange';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { filterActive, filterHealthy } from '@/utils/roster';
import { isActive } from '@/engine/warrior/warriorStatus';

/**
 * Stable Lords — Random Event Pipeline Pass
 */

type Events = Record<string, EventNarrative>;

interface EventCtx {
  brawlRng: IRNGService;
  nextWeek: number;
  rosterUpdates: Map<WarriorId, Partial<Warrior>>;
  newsletterItems: NewsletterItem[];
  ledgerEntries: LedgerEntry[];
  treasuryDelta: number;
}

/** 🍺 Tavern Brawl Event */
function rollTavernBrawl(state: GameState, events: Events, ctx: EventCtx): void {
  if (ctx.brawlRng.next() >= 0.05 || state.roster.length === 0) return;
  const activeWarriors = filterHealthy(state.roster);
  if (activeWarriors.length === 0) return;
  const brawler = ctx.brawlRng.pick(activeWarriors);
  const e = events.tavern_brawl;
  if (!brawler || !e) return;

  ctx.rosterUpdates.set(brawler.id, {
    fame: (brawler.fame || 0) + 5,
    injuries: [
      ...(brawler.injuries || []),
      {
        id: ctx.brawlRng.uuid() as InjuryId,
        name: e.injury_name ?? 'Black Eye',
        description: e.injury_desc ?? 'Caught a nasty right hook in the tavern.',
        severity: 'Minor',
        weeksRemaining: 1,
        penalties: { ATT: -1 },
      },
    ],
  });

  ctx.newsletterItems.push(
    makeNewsletterItem(
      ctx.brawlRng,
      ctx.nextWeek,
      e.title,
      e.newsletter,
      { name: brawler.name, fame: 5 },
      'event'
    )
  );
}

/** ☄️ Star-crossed Blessing Event */
function rollCelestialBlessing(state: GameState, events: Events, ctx: EventCtx): void {
  const blessingChance = state.weather === 'Mana Surge' ? 0.25 : 0.03;
  if (ctx.brawlRng.next() >= blessingChance || state.roster.length === 0) return;
  const youngWarriors = state.roster.filter((w) => isActive(w) && (w.age || 0) <= 25);
  if (youngWarriors.length === 0) return;
  const chosen = ctx.brawlRng.pick(youngWarriors);
  const e = events.celestial_blessing;
  if (!chosen || !e) return;

  const existingUpdate = ctx.rosterUpdates.get(chosen.id) || {};
  ctx.rosterUpdates.set(chosen.id, {
    ...existingUpdate,
    fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 15,
    xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 2,
  });

  ctx.newsletterItems.push(
    makeNewsletterItem(
      ctx.brawlRng,
      ctx.nextWeek,
      e.title,
      e.newsletter,
      { name: chosen.name, fame: 15, xp: 2 },
      'event'
    )
  );
}

/** 🏺 Lost Relic Discovery Event */
function rollLostRelic(state: GameState, events: Events, ctx: EventCtx): void {
  if (ctx.brawlRng.next() >= 0.04 || state.roster.length === 0) return;
  const activeWarriors = filterActive(state.roster);
  if (activeWarriors.length === 0) return;
  const chosen = ctx.brawlRng.pick(activeWarriors);
  const e = events.lost_relic;
  if (!chosen || !e) return;

  const existingUpdate = ctx.rosterUpdates.get(chosen.id) || {};
  ctx.rosterUpdates.set(chosen.id, {
    ...existingUpdate,
    fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 10,
    xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 5,
  });

  ctx.newsletterItems.push(
    makeNewsletterItem(
      ctx.brawlRng,
      ctx.nextWeek,
      e.title,
      e.newsletter,
      { name: chosen.name, fame: 10, xp: 5 },
      'event'
    )
  );
}

/** 💰 Mysterious Patron Event */
function rollMysteriousPatron(events: Events, ctx: EventCtx): void {
  if (ctx.brawlRng.next() >= 0.05) return;
  const e = events.mysterious_patron;
  if (!e) return;

  const gold = rollRange(ctx.brawlRng, 100, 401); // 100-500 gold
  ctx.treasuryDelta += gold;
  ctx.ledgerEntries.push(
    makeLedgerEntry(ctx.brawlRng, ctx.nextWeek, 'Mysterious Patron Donation', gold, 'other')
  );

  ctx.newsletterItems.push(
    makeNewsletterItem(ctx.brawlRng, ctx.nextWeek, e.title, e.newsletter, { gold }, 'event')
  );
}

/** 👺 Goblin Merchant Event */
function rollGoblinMerchant(state: GameState, events: Events, ctx: EventCtx): void {
  if (
    ctx.brawlRng.next() >= 0.04 ||
    (state.treasury || 0) + ctx.treasuryDelta < 20 ||
    state.roster.length === 0
  ) {
    return;
  }
  const activeWarriors = filterActive(state.roster);
  if (activeWarriors.length === 0) return;
  const chosen = ctx.brawlRng.pick(activeWarriors);
  const e = events.goblin_merchant;
  if (!chosen || !e) return;

  const existingUpdate = ctx.rosterUpdates.get(chosen.id) || {};
  const currentXp = existingUpdate.xp !== undefined ? existingUpdate.xp : chosen.xp || 0;
  ctx.rosterUpdates.set(chosen.id, {
    ...existingUpdate,
    xp: currentXp + 5,
  });

  ctx.treasuryDelta -= 20;
  ctx.ledgerEntries.push(
    makeLedgerEntry(ctx.brawlRng, ctx.nextWeek, 'Goblin Merchant', -20, 'other')
  );

  ctx.newsletterItems.push(
    makeNewsletterItem(
      ctx.brawlRng,
      ctx.nextWeek,
      e.title,
      e.newsletter,
      { name: chosen.name, xp: 5 },
      'event'
    )
  );
}

/**
 * Run event pass.
 * @param state -
 * @param nextWeek -
 * @param rootRng -
 */
export function runEventPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const events = narrativeContent.events as unknown as Events;
  const ctx: EventCtx = {
    brawlRng: resolveRng(rootRng, nextWeek * 999 + 1),
    nextWeek,
    rosterUpdates: new Map<WarriorId, Partial<Warrior>>(),
    newsletterItems: [],
    ledgerEntries: [],
    treasuryDelta: 0,
  };

  rollTavernBrawl(state, events, ctx);
  rollCelestialBlessing(state, events, ctx);
  rollLostRelic(state, events, ctx);
  rollMysteriousPatron(events, ctx);
  rollGoblinMerchant(state, events, ctx);

  return {
    rosterUpdates: ctx.rosterUpdates,
    newsletterItems: ctx.newsletterItems,
    ...(ctx.ledgerEntries.length > 0 ? { ledgerEntries: ctx.ledgerEntries } : {}),
    ...(ctx.treasuryDelta !== 0 ? { treasuryDelta: ctx.treasuryDelta } : {}),
  };
}
