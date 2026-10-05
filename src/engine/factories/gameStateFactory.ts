/**
 * Game State Factory - Creates initial game state
 * Extracted from factories.ts to follow SRP
 */
import type {
  GameState,
  OwnerPersonality,
  RivalStableData,
  WorldDifficulty,
  WorldOptions,
} from '@/types/state.types';
import { rollCompetence } from '@/engine/ai/competence';
import { type PoolWarrior } from '@/engine/recruitment/recruitment';
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';
import { FightingStyle, type StableId, type WarriorId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeWarrior } from './warriorFactory';
import { generatePotential } from '@/engine/warrior/potential';
import { BACKSTORY_IDS } from '@/data/backstories';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import { SAVE_STATE_VERSION } from '@/constants/core';
import { INITIAL_RIVAL_COUNT } from '@/constants/economy';
import { OWNER_PERSONALITIES_WITH_POLICY } from '@/engine/ai/traitPolicy';

/** The empty-but-complete GameState literal every fresh save starts from. */
function baseFreshState(createdAt: string): GameState {
  return {
    meta: {
      gameName: 'Stable Lords',
      version: SAVE_STATE_VERSION,
      createdAt,
    },
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    treasury: 1000,
    ledger: [],
    week: 1,
    year: 1,
    absoluteWeek: 1,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    deadWarriorIds: [],
    killEvents: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    legacyFounderQueue: [],
    freeAgents: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    isFTUE: true,
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    arenaChampions: {},
    grandChampions: [],
    realmRankings: {},
    awards: [],
    bookmarks: [],
    progression: DEFAULT_PROGRESSION,
  };
}

/**
 * Creates the initial, deterministic game state for a new game.
 */
export function createFreshState(
  seed: string,
  createdAt: string = new Date().toISOString(),
  worldOptions?: WorldOptions
): GameState {
  const numericSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = new SeededRNG(numericSeed);

  const state = baseFreshState(createdAt);
  state.worldOptions = worldOptions;
  state.rivals = generateInitialRivals(rng, worldOptions?.difficulty);
  state.recruitPool = generateInitialRecruitPool(rng);

  return state;
}

/** Seeded selection of the initial rival stables. */
function generateInitialRivals(
  rng: IRNGService,
  difficulty?: WorldDifficulty
): RivalStableData[] {
  const RIVAL_NAMES = (narrativeContent as NarrativeContent).recruitment.rival_stable_names;
  // Every seeded owner must map to a trait policy — the canonical list lives
  // in ai/traitPolicy so personalities can never drift out of coverage.
  const PERSONALITIES: OwnerPersonality[] = OWNER_PERSONALITIES_WITH_POLICY;

  // Shuffle and pick INITIAL_RIVAL_COUNT
  const pool = [...RIVAL_NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const temp = pool[i];
    const temp2 = pool[j];
    if (temp !== undefined && temp2 !== undefined) {
      pool[i] = temp2;
      pool[j] = temp;
    }
  }

  return pool.slice(0, INITIAL_RIVAL_COUNT).map((name): RivalStableData => {
    const personalityIndex = Math.floor(rng.next() * PERSONALITIES.length);
    const backstoryIdx = Math.floor(rng.next() * BACKSTORY_IDS.length);
    const backstoryId = BACKSTORY_IDS[backstoryIdx];
    if (!backstoryId) {
      throw new Error('Backstory ID selection failed');
    }
    const ownerId = rng.uuid() as StableId;
    return {
      id: rng.uuid() as StableId,
      fame: 100,
      treasury: 1500 + Math.floor(rng.next() * 1000),
      owner: {
        id: ownerId,
        name: `Lord ${name.split(' ')[0]}`,
        stableName: name,
        personality: PERSONALITIES[personalityIndex],
        competence: rollCompetence(rng, 'Established', difficulty),
        backstoryId,
        fame: 100,
        renown: 10,
        titles: 0,
        age: 35 + Math.floor(rng.next() * 25), // Initial age 35-60
        generation: 0,
      },
      roster: [],
      ledger: [],
      trainingAssignments: [],
    };
  });
}

/** Seeded 12-warrior initial recruitment pool (6 styles × 2). */
function generateInitialRecruitPool(rng: IRNGService): PoolWarrior[] {
  const initialStyles = [
    FightingStyle.AimedBlow,
    FightingStyle.BashingAttack,
    FightingStyle.LungingAttack,
    FightingStyle.SlashingAttack,
    FightingStyle.StrikingAttack,
    FightingStyle.WallOfSteel,
  ];

  return initialStyles
    .concat(initialStyles)
    .slice(0, 12)
    .map((style, i) => {
      // Use rng for initial attributes (10 +/- 3)
      const attrBase = () => 7 + Math.floor(rng.next() * 7);
      const attrs = {
        ST: attrBase(),
        CN: attrBase(),
        SZ: attrBase(),
        WT: attrBase(),
        WL: attrBase(),
        SP: attrBase(),
        DF: attrBase(),
      };

      const baseWarrior = makeWarrior(
        { id: rng.uuid() as WarriorId, name: `Recruit ${i + 1}`, style: style, attrs: attrs, overrides: {}, rng: rng }
      );
      return {
        ...baseWarrior,
        cost: 150 + Math.floor(rng.next() * 150),
        tier: 'Common',
        lore: (narrativeContent as NarrativeContent).recruitment.origin[0], // Seeded fallback
        addedWeek: 1,
        potential: generatePotential(attrs, 'Common', rng),
      } as PoolWarrior;
    });
}
