import type { GameState, NewsletterItem, LedgerEntry } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import narrativeContent from '@/data/narrativeContent.json';
import { StateImpact } from '@/engine/impacts';
import { type WarriorId, type InjuryId } from '@/types/shared.types';
import type { EventNarrative } from '@/types/narrative.types';
import { rollRange } from '@/engine/core/rng/rollRange';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeNewsletterItem } from '@/engine/narrative/newsletterHelpers';
import { filterActive, filterHealthy } from '@/utils/roster';

/**
 * Stable Lords — Random Event Pipeline Pass
 */

/**
 * Run event pass.
 * @param rootRng - Root rng. (optional)
 */
export function runEventPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const brawlRng = rootRng || new SeededRNGService(nextWeek * 999 + 1);
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];
  let treasuryDelta = 0;
  const ledgerEntries: LedgerEntry[] = [];
  const events = narrativeContent.events as Record<string, EventNarrative>;

  // 🍺 Tavern Brawl Event
  if (brawlRng.next() < 0.05 && state.roster.length > 0) {
    const activeWarriors = filterHealthy(state.roster);
    if (activeWarriors.length > 0) {
      const brawler = brawlRng.pick(activeWarriors);
      const e = events.tavern_brawl;
      if (brawler && e) {
        rosterUpdates.set(brawler.id, {
          fame: (brawler.fame || 0) + 5,
          injuries: [
            ...(brawler.injuries || []),
            {
              id: brawlRng.uuid() as InjuryId,
              name: e.injury_name ?? 'Black Eye',
              description: e.injury_desc ?? 'Caught a nasty right hook in the tavern.',
              severity: 'Minor',
              weeksRemaining: 1,
              penalties: { ATT: -1 },
            },
          ],
        });

        newsletterItems.push(
          makeNewsletterItem(
            brawlRng,
            nextWeek,
            e.title,
            e.newsletter,
            { name: brawler.name, fame: 5 },
            'event'
          )
        );
      }
    }
  }

  // ☄️ Star-crossed Blessing Event
  const blessingChance = state.weather === 'Mana Surge' ? 0.25 : 0.03;
  if (brawlRng.next() < blessingChance && state.roster.length > 0) {
    const youngWarriors = filterActive(state.roster).filter((w) => (w.age || 0) <= 25);
    if (youngWarriors.length > 0) {
      const chosen = brawlRng.pick(youngWarriors);
      const e = events.celestial_blessing;
      if (chosen && e) {
        const existingUpdate = rosterUpdates.get(chosen.id) || {};
        rosterUpdates.set(chosen.id, {
          ...existingUpdate,
          fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 15,
          xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 2,
        });

        newsletterItems.push(
          makeNewsletterItem(
            brawlRng,
            nextWeek,
            e.title,
            e.newsletter,
            { name: chosen.name, fame: 15, xp: 2 },
            'event'
          )
        );
      }
    }
  }

  // 🏺 Lost Relic Discovery Event
  if (brawlRng.next() < 0.04 && state.roster.length > 0) {
    const activeWarriors = filterActive(state.roster);
    if (activeWarriors.length > 0) {
      const chosen = brawlRng.pick(activeWarriors);
      const e = events.lost_relic;
      if (chosen && e) {
        const existingUpdate = rosterUpdates.get(chosen.id) || {};
        rosterUpdates.set(chosen.id, {
          ...existingUpdate,
          fame: (chosen.fame || 0) + (existingUpdate.fame || 0) + 10,
          xp: (chosen.xp || 0) + (existingUpdate.xp || 0) + 5,
        });

        newsletterItems.push(
          makeNewsletterItem(
            brawlRng,
            nextWeek,
            e.title,
            e.newsletter,
            { name: chosen.name, fame: 10, xp: 5 },
            'event'
          )
        );
      }
    }
  }

  // 💰 Mysterious Patron Event
  if (brawlRng.next() < 0.05) {
    const e = events.mysterious_patron;
    if (e) {
      const gold = rollRange(brawlRng, 100, 401); // 100-500 gold
      treasuryDelta += gold;
      ledgerEntries.push(
        makeLedgerEntry(brawlRng, nextWeek, 'Mysterious Patron Donation', gold, 'other')
      );

      newsletterItems.push(
        makeNewsletterItem(brawlRng, nextWeek, e.title, e.newsletter, { gold }, 'event')
      );
    }
  }

  // 👺 Goblin Merchant Event
  if (
    brawlRng.next() < 0.04 &&
    (state.treasury || 0) + treasuryDelta >= 20 &&
    state.roster.length > 0
  ) {
    const activeWarriors = filterActive(state.roster);
    if (activeWarriors.length > 0) {
      const chosen = brawlRng.pick(activeWarriors);
      const e = events.goblin_merchant;
      if (chosen && e) {
        const existingUpdate = rosterUpdates.get(chosen.id) || {};
        const currentXp = existingUpdate.xp !== undefined ? existingUpdate.xp : chosen.xp || 0;
        rosterUpdates.set(chosen.id, {
          ...existingUpdate,
          xp: currentXp + 5,
        });

        treasuryDelta -= 20;
        ledgerEntries.push(makeLedgerEntry(brawlRng, nextWeek, 'Goblin Merchant', -20, 'other'));

        newsletterItems.push(
          makeNewsletterItem(
            brawlRng,
            nextWeek,
            e.title,
            e.newsletter,
            { name: chosen.name, xp: 5 },
            'event'
          )
        );
      }
    }
  }

  return {
    rosterUpdates,
    newsletterItems,
    ...(ledgerEntries.length > 0 ? { ledgerEntries } : {}),
    ...(treasuryDelta !== 0 ? { treasuryDelta } : {}),
  };
}
