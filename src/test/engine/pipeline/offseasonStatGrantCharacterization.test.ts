/**
 * Characterization: exact observable deltas of every offseason handler whose
 * `warriorOutcome({ stat: addStat(...) }, announce)` boilerplate is about to
 * be collapsed into `statGrantOutcome`. These tests pin the pre-refactor
 * behavior — roster updates, announce payloads (rendered through an all-keys
 * newsletter template so absent keys stay literal), treasury/ledger effects,
 * and insight tokens — so the dedup refactor must produce identical output.
 *
 * `makeStubRng` fixes next()=0.5 / pick→first / roll→min, making every roll
 * deterministic and hand-computable.
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/test/_fixtures/factories';
import { makeSeasonalTestState } from '@/test/_fixtures/seasonalState';
import { makeStubRng, makeOffseasonCtx } from '@/test/_fixtures/offseasonCtx';
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type {
  OffseasonEventNarrative,
  OffseasonEventContext,
} from '@/engine/pipeline/offseasonEvents/types';
import {
  handleFameBoost,
  handleEpiphany,
  handleBardsSong,
  handleMysticVision,
  handleStrangeDream,
  handleMeteorShower,
  handleGladiatorOlympics,
  handleLoyalStrayDog,
  handleChaosSpores,
  handleChaosWeaversGift,
  handleShadowTraining,
  handleOffseasonTrainingCamp,
  handleWanderingMerchantStrangeBrew,
  handleWanderingBlacksmith,
} from '@/engine/pipeline/offseasonEvents/buffHandlers';
import {
  handleWanderingFortuneTeller,
  handleDreamweaverVisit,
} from '@/engine/pipeline/offseasonEvents/socialHandlers/visitors';
import {
  handleShadowMarketRun,
  handleLoyalStray,
  handleBountyHunterVisit,
  handleMidnightMarket,
} from '@/engine/pipeline/offseasonEvents/socialHandlers/street';
import {
  handleStreetPerformance,
  handleTravelingCircus,
} from '@/engine/pipeline/offseasonEvents/socialHandlers/feasts';
import { handleChaosRift } from '@/engine/pipeline/offseasonEvents/chaosHandlers/rift';
import {
  handleSuspiciousMushroomStew,
  handlePhantomSparringPartner,
  handleDreamweaversMist,
  handlePrismaticGaleExposure,
} from '@/engine/pipeline/offseasonEvents/chaosHandlers/oddities';
import {
  handleTemporalAnomaly,
  handleCursedTreasureDiscovery,
  handleAbyssalTempestRitual,
  handleShatteredSkiesRitual,
  handleWeepingSkies,
} from '@/engine/pipeline/offseasonEvents/chaosHandlers/phenomena';
import {
  handleTavernBrawl,
  handlePlagueOutbreak,
  handleWildAnimalAttack,
  handleGoblinRaid,
  handleUndergroundPitFight,
  handleTavernBrawlSurprise,
  handleSecretFightClub,
  handleChaoticWeatherExperiment,
} from '@/engine/pipeline/offseasonEvents/injuryHandlers';
import type { OffseasonEventRun } from '@/engine/pipeline/offseasonEvents/helpers';

type Handler = (run: OffseasonEventRun) => void;

const TEMPLATE = '{{name}}|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}';
const news = (body: string) => [body];

interface Expected {
  updates: Record<string, unknown> | null;
  news: string[];
  treasury?: number;
  ledger?: string[];
  insights?: { type: string; origin: string }[];
}

interface Case {
  name: string;
  handler: Handler;
  warrior?: Partial<Warrior>;
  treasury?: number;
  expected: Expected;
}

const CASES: Case[] = [
  {
    name: 'handleFameBoost',
    handler: handleFameBoost,
    expected: {
      updates: { fame: 75 },
      news: news('|xp:{{xp}}|fame:25|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleEpiphany',
    handler: handleEpiphany,
    expected: {
      updates: { fame: 60, xp: 115 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      insights: [{ type: 'Attribute', origin: 'Epiphany' }],
    },
  },
  {
    name: 'handleBardsSong',
    handler: handleBardsSong,
    expected: {
      updates: { fame: 75 },
      news: news('|xp:{{xp}}|fame:25|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleMysticVision',
    handler: handleMysticVision,
    expected: {
      updates: { xp: 115, fame: 60 },
      news: news('|xp:15|fame:10|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleStrangeDream',
    handler: handleStrangeDream,
    expected: {
      updates: { xp: 110 },
      news: news('|xp:10|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleMeteorShower',
    handler: handleMeteorShower,
    expected: {
      updates: { xp: 120, fame: 63 },
      news: news('|xp:20|fame:13|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleGladiatorOlympics',
    handler: handleGladiatorOlympics,
    expected: {
      updates: { xp: 120, fame: 65 },
      news: news('|xp:20|fame:15|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleLoyalStrayDog',
    handler: handleLoyalStrayDog,
    expected: {
      updates: { xp: 110 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleChaosSpores',
    handler: handleChaosSpores,
    expected: {
      updates: { xp: 125, traits: ['spore_kissed'] },
      news: news('|xp:25|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleChaosWeaversGift',
    handler: handleChaosWeaversGift,
    expected: {
      updates: { xp: 130 },
      news: news('|xp:30|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      insights: [{ type: 'Tactic', origin: 'Chaos Weaver' }],
    },
  },
  {
    name: 'handleShadowTraining',
    handler: handleShadowTraining,
    expected: {
      updates: { xp: 125, fame: 42 },
      news: news('|xp:25|fame:8|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleOffseasonTrainingCamp',
    handler: handleOffseasonTrainingCamp,
    expected: {
      updates: { xp: 150 },
      news: news('|xp:50|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleWanderingMerchantStrangeBrew',
    handler: handleWanderingMerchantStrangeBrew,
    expected: {
      updates: { xp: 120, fame: 60 },
      news: news('|xp:20|fame:10|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleWanderingBlacksmith',
    handler: handleWanderingBlacksmith,
    treasury: 100,
    expected: {
      updates: { xp: 125 },
      news: news('|xp:25|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      treasury: -50,
      ledger: ['Wandering Blacksmith'],
    },
  },
  {
    name: 'handleWanderingFortuneTeller',
    handler: handleWanderingFortuneTeller,
    expected: {
      updates: { xp: 115 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:30|trait:{{trait}}'),
      treasury: -30,
      ledger: ['Fortune Teller Reading'],
      insights: [{ type: 'Style', origin: 'Wandering Fortune Teller' }],
    },
  },
  {
    name: 'handleDreamweaverVisit',
    handler: handleDreamweaverVisit,
    expected: {
      updates: { xp: 120 },
      news: news('|xp:20|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      insights: [{ type: 'Style', origin: 'Dreamweaver' }],
    },
  },
  {
    name: 'handleShadowMarketRun',
    handler: handleShadowMarketRun,
    expected: {
      updates: { fame: 65 },
      news: news('|xp:{{xp}}|fame:15|gold:38|trait:{{trait}}'),
      treasury: -38,
      ledger: ['Shadow Market Excursion'],
      insights: [{ type: 'Style', origin: 'Shadow Market' }],
    },
  },
  {
    name: 'handleLoyalStray',
    handler: handleLoyalStray,
    expected: {
      updates: { xp: 110, fame: 55 },
      news: news('|xp:10|fame:5|gold:25|trait:{{trait}}'),
      treasury: -25,
      ledger: ['Dog Food & Treats'],
    },
  },
  {
    name: 'handleBountyHunterVisit',
    handler: handleBountyHunterVisit,
    expected: {
      updates: { fame: 60 },
      news: news('|xp:{{xp}}|fame:10|gold:200|trait:{{trait}}'),
      treasury: 200,
      ledger: ['Bounty Information Payout'],
    },
  },
  {
    name: 'handleMidnightMarket',
    handler: handleMidnightMarket,
    expected: {
      updates: { xp: 120 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:40|trait:{{trait}}'),
      treasury: -40,
      ledger: ['Midnight Market Elixirs'],
      insights: [{ type: 'Tactic', origin: 'Midnight Market' }],
    },
  },
  {
    name: 'handleStreetPerformance',
    handler: handleStreetPerformance,
    expected: {
      updates: { fame: 65, flair: ['Local Hero'] },
      news: news('|xp:{{xp}}|fame:15|gold:75|trait:{{trait}}'),
      treasury: 75,
      ledger: ['Street Performance Tips'],
    },
  },
  {
    name: 'handleTravelingCircus',
    handler: handleTravelingCircus,
    expected: {
      updates: { xp: 130, fame: 70 },
      news: news('|xp:30|fame:20|gold:{{gold}}|trait:{{trait}}'),
      treasury: -25,
      ledger: ['Traveling Circus Distraction'],
    },
  },
  {
    name: 'handleChaosRift',
    handler: handleChaosRift,
    expected: {
      updates: { xp: 125, fame: 65 },
      news: news('|xp:25|fame:15|gold:{{gold}}|trait:{{trait}}'),
      treasury: 150,
      ledger: ['Sold Chaos Crystal'],
      insights: [{ type: 'Style', origin: 'Chaos Rift' }],
    },
  },
  {
    name: 'handleSuspiciousMushroomStew',
    handler: handleSuspiciousMushroomStew,
    expected: {
      updates: {
        xp: 128,
        injuries: [
          expect.objectContaining({
            name: 'Stomach Ache',
            severity: 'Minor',
            weeksRemaining: 1,
            penalties: { CN: -1, SP: -1 },
          }),
        ],
      },
      news: news('|xp:28|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handlePhantomSparringPartner',
    handler: handlePhantomSparringPartner,
    expected: {
      updates: { xp: 140, fatigue: 30 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleDreamweaversMist',
    handler: handleDreamweaversMist,
    expected: {
      updates: {
        xp: 115,
        injuries: [
          expect.objectContaining({
            name: 'Magic Burn',
            severity: 'Minor',
            weeksRemaining: 1,
            penalties: { CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handlePrismaticGaleExposure',
    handler: handlePrismaticGaleExposure,
    expected: {
      updates: {
        xp: 120,
        injuries: [
          expect.objectContaining({
            name: 'Prismatic Dizziness',
            severity: 'Minor',
            weeksRemaining: 1,
            penalties: { SP: -1, CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      insights: [{ type: 'Style', origin: 'Prismatic Gale' }],
    },
  },
  {
    name: 'handleTemporalAnomaly',
    handler: handleTemporalAnomaly,
    warrior: { traits: ['veteran_eye'] as never },
    expected: {
      updates: { xp: 135, traits: [] },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
      insights: [{ type: 'Style', origin: 'Temporal Anomaly' }],
    },
  },
  {
    name: 'handleCursedTreasureDiscovery',
    handler: handleCursedTreasureDiscovery,
    expected: {
      updates: {
        fame: 35,
        injuries: [
          expect.objectContaining({
            name: 'Curse of Greed',
            severity: 'Moderate',
            weeksRemaining: 4,
            penalties: { WL: -2, CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:15|gold:400|trait:{{trait}}'),
      treasury: 400,
      ledger: ['Cursed Treasure Gained'],
    },
  },
  {
    name: 'handleAbyssalTempestRitual',
    handler: handleAbyssalTempestRitual,
    expected: {
      updates: {
        xp: 125,
        injuries: [
          expect.objectContaining({
            name: 'Abyssal Gaze',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: { SP: -1, CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleShatteredSkiesRitual',
    handler: handleShatteredSkiesRitual,
    expected: {
      updates: { xp: 125, fatigue: 35 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleWeepingSkies',
    handler: handleWeepingSkies,
    expected: {
      updates: { xp: 120 },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleTavernBrawl',
    handler: handleTavernBrawl,
    expected: {
      updates: {
        fame: 65,
        injuries: [
          expect.objectContaining({
            name: 'Bruised Ribs',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: { CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:15|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handlePlagueOutbreak',
    handler: handlePlagueOutbreak,
    expected: {
      updates: {
        fame: 40,
        injuries: [
          expect.objectContaining({
            name: 'Camp Fever',
            severity: 'Minor',
            weeksRemaining: 3,
            penalties: { CN: -2, ST: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:10|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleWildAnimalAttack',
    handler: handleWildAnimalAttack,
    expected: {
      updates: {
        fame: 58,
        injuries: [
          expect.objectContaining({
            name: 'Bite Wound',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: { CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:8|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleGoblinRaid',
    handler: handleGoblinRaid,
    expected: {
      updates: {
        injuries: [
          expect.objectContaining({
            name: 'Goblin Scratch',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: { CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:{{fame}}|gold:35|trait:{{trait}}'),
      treasury: -35,
      ledger: ['Goblin Raid Loss'],
    },
  },
  {
    name: 'handleUndergroundPitFight',
    handler: handleUndergroundPitFight,
    expected: {
      updates: {
        fame: 73,
        injuries: [
          expect.objectContaining({
            name: 'Busted Knuckles',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: { SP: -1, CN: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:23|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleTavernBrawlSurprise',
    handler: handleTavernBrawlSurprise,
    expected: {
      updates: {
        fame: 70,
        injuries: [
          expect.objectContaining({
            name: 'Tavern Bruises',
            severity: 'Minor',
            weeksRemaining: 1,
            penalties: { SP: -1 },
          }),
        ],
      },
      news: news('|xp:{{xp}}|fame:20|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleSecretFightClub',
    handler: handleSecretFightClub,
    expected: {
      updates: {
        xp: 120,
        fame: 65,
        injuries: [
          expect.objectContaining({
            name: 'Brawler Bruises',
            severity: 'Minor',
            weeksRemaining: 3,
            penalties: { SP: -1 },
          }),
        ],
      },
      news: news('|xp:20|fame:15|gold:{{gold}}|trait:{{trait}}'),
    },
  },
  {
    name: 'handleChaoticWeatherExperiment',
    handler: handleChaoticWeatherExperiment,
    expected: {
      updates: {
        xp: 120,
        injuries: [
          expect.objectContaining({
            name: 'Magic Burns',
            severity: 'Minor',
            weeksRemaining: 1,
            penalties: { SP: -1 },
          }),
        ],
      },
      news: news('|xp:20|fame:{{fame}}|gold:{{gold}}|trait:{{trait}}'),
    },
  },
];

describe('offseason handler characterization (pre-statGrantOutcome)', () => {
  for (const c of CASES) {
    it(`${c.name} produces its exact recorded deltas`, () => {
      const warrior = makeWarrior({
        id: 'w1' as never,
        name: 'Test Warrior',
        xp: 100,
        fame: 50,
        fatigue: 20,
        ...c.warrior,
      });
      const state: GameState = {
        ...makeSeasonalTestState([warrior]),
        treasury: c.treasury ?? 0,
      } as GameState;
      const ctx: OffseasonEventContext = makeOffseasonCtx();
      const e: OffseasonEventNarrative = {
        title: 'T',
        effectType: 'epiphany',
        newsletter: [TEMPLATE],
      };
      c.handler({ state, nextWeek: 7, e, rng: makeStubRng(), ctx });

      const upd = ctx.rosterUpdates.get('w1' as never) ?? null;
      expect(upd).toEqual(c.expected.updates);
      expect(ctx.newsletterItems.map((n) => n.items[0])).toEqual(
        c.expected.news.map((s) => `Test Warrior${s}`)
      );
      if (c.expected.treasury !== undefined) {
        expect(ctx.treasuryDelta).toBe(c.expected.treasury);
      }
      if (c.expected.ledger) {
        expect(ctx.ledgerEntries.map((l) => l.label)).toEqual(c.expected.ledger);
      }
      if (c.expected.insights) {
        expect(ctx.insightTokens).toMatchObject(
          c.expected.insights.map((i) => ({ ...i, warriorId: 'w1' }))
        );
      }
    });
  }
});
