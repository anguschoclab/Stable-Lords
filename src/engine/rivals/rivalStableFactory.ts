/**
 * Rival Stable Factory - Generates rival stables from templates
 * Extracted from rivals.ts to follow SRP.
 *
 * **Intentional asymmetry (audited 2026-04-19)**: startup rivals are seeded
 * with `biasedAttrs`/`createRivalWarrior` rather than drawn from the player's
 * shared recruit pool (`recruitment.ts::generateRecruit`). This is a catch-up
 * scaffold — rivals need an initial roster before the recruit-pool pipeline
 * has had a chance to run. *Ongoing* rival recruitment (post-startup) goes
 * through `recruitmentWorker.ts` and signs from the same shared pool the
 * player sees. Do not alter the factory bias without also replacing the
 * startup-state warrior generator.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { RivalStableData, Owner } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { StableTemplate } from '@/data/templates';
import type { StableId } from '@/types/shared.types';
import { ALL_TEMPLATES } from '@/data/templates';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import { generateCrest } from '../crest/crestGenerator';
import { biasedAttrs, createRivalWarrior } from './rivalWarriorFactory';
import { generateStableTrainers } from './rivalTrainerFactory';

/**
 * Gets stable templates.
 */
export function getStableTemplates(): StableTemplate[] {
  return [...ALL_TEMPLATES];
}

/**
 * Generate rival stables from templates.
 * Scaling: Provides bonus gold and stats for expansion stables joining mid-game.
 */
export function generateRivalStables(
  count: number,
  seed: number,
  week: number = 0
): RivalStableData[] {
  const rng = new SeededRNGService(seed);
  const usedWarriorNames = new Set<string>();
  const rivals: RivalStableData[] = [];

  // Support for count > templates.length via over-sampling with procedural variance
  const iterations = Math.ceil(count / ALL_TEMPLATES.length);
  const picked: { tmpl: StableTemplate; iteration: number }[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = [...ALL_TEMPLATES].sort(() => rng.next() - 0.5);
    shuffled.forEach((tmpl) => {
      if (picked.length < count) {
        picked.push({ tmpl, iteration: iter });
      }
    });
  }

  for (const item of picked) {
    rivals.push(buildRivalStable(item.tmpl, item.iteration, week, rng, usedWarriorNames));
  }
  return rivals;
}

/** Build one rival stable from a template pick. */
function buildRivalStable(
  tmpl: StableTemplate,
  iteration: number,
  week: number,
  rng: IRNGService,
  usedWarriorNames: Set<string>
): RivalStableData {
  const stableId = rng.uuid() as StableId;

  // Procedural name variance for duplicates
  const nameSuffix =
    iteration > 0
      ? ` [${iteration === 1 ? 'II' : iteration === 2 ? 'III' : iteration === 3 ? 'IV' : 'V'}]`
      : '';
  const stableName = `${tmpl.stableName}${nameSuffix}`;
  const owner: Owner = {
    id: stableId,
    name:
      iteration > 0
        ? `${tmpl.ownerName} ${String.fromCharCode(64 + iteration + 1)}`
        : tmpl.ownerName,
    stableName: stableName,
    fame:
      tmpl.fameRange[0] + Math.floor(rng.next() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
    renown: tmpl.tier === 'Legendary' ? 5 : tmpl.tier === 'Major' ? 2 : 0,
    titles:
      tmpl.tier === 'Legendary'
        ? 2 + Math.floor(rng.next() * 3)
        : tmpl.tier === 'Major'
          ? Math.floor(rng.next() * 3)
          : 0,
    personality: tmpl.personality,
    metaAdaptation: tmpl.metaAdaptation,
    favoredStyles: tmpl.preferredStyles,
    backstoryId: tmpl.backstoryId,
  };

  const warriors = buildRoster(tmpl, stableId, week, rng, usedWarriorNames);

  const [minT, maxT] = tmpl.trainerRange;
  const trainers = generateStableTrainers(
    () => rng.next(),
    stableId,
    tmpl.philosophy,
    minT + Math.floor(rng.next() * (maxT - minT + 1)),
    tmpl.tier
  );

  const catchupGold = week * 50;
  const initialGold =
    (tmpl.tier === 'Legendary'
      ? 2000
      : tmpl.tier === 'Major'
        ? 1200
        : tmpl.tier === 'Established'
          ? 800
          : 500) + catchupGold;

  // Generate crest for this stable
  const crestSeed = Math.floor(rng.next() * 100000);
  const crest = generateCrest({
    seed: crestSeed,
    philosophy: tmpl.philosophy,
    tier: tmpl.tier,
  });

  return {
    id: stableId,
    owner: {
      ...owner,
      generation: 0,
    },
    roster: warriors,
    treasury: initialGold,
    motto: tmpl.motto,
    origin: tmpl.origin,
    philosophy: tmpl.philosophy,
    tier: tmpl.tier,
    trainers,
    strategy: {
      intent: iteration % 3 === 0 ? 'EXPANSION' : 'CONSOLIDATION',
      planWeeksRemaining: 4 + Math.floor(rng.next() * 4),
    },
    agentMemory: {
      lastTreasury: initialGold,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      opponentDossiers: {},
    },
    actionHistory: [],
    fame: iteration > 0 ? 50 + iteration * 100 : 0,
    ledger: [],
    trainingAssignments: [],
    crest,
  };
}

/** Roll a warrior's style — biased toward the template's preferred styles. */
function pickWarriorStyle(tmpl: StableTemplate, rng: IRNGService): FightingStyle {
  if (rng.next() < 0.7 && tmpl.preferredStyles.length > 0) {
    const preferred =
      tmpl.preferredStyles[Math.floor(rng.next() * tmpl.preferredStyles.length)];
    if (!preferred) {
      throw new Error('Style selection from preferredStyles failed');
    }
    return preferred;
  }
  const allStyles = Object.values(FightingStyle);
  const randomStyle = allStyles[Math.floor(rng.next() * allStyles.length)];
  if (!randomStyle) {
    throw new Error('Style selection from all styles failed');
  }
  return randomStyle;
}

/** Build the stable's starting warrior roster from the template. */
function buildRoster(
  tmpl: StableTemplate,
  stableId: StableId,
  week: number,
  rng: IRNGService,
  usedWarriorNames: Set<string>
): Warrior[] {
  const [minR, maxR] = tmpl.rosterRange;
  const warriorCount = minR + Math.floor(rng.next() * (maxR - minR + 1));
  const warriors: Warrior[] = [];
  const namePool = [...tmpl.warriorNames].sort(() => rng.next() - 0.5);

  for (let j = 0; j < warriorCount; j++) {
    let wName = namePool.find((n) => !usedWarriorNames.has(n));
    if (!wName) wName = `${tmpl.stableName.split(' ').pop()?.toUpperCase()}_${j}`;
    usedWarriorNames.add(wName);

    const style = pickWarriorStyle(tmpl, rng);

    // Catch-up Attribute Scaling: +1 point per week (cap +40)
    const catchupStats = Math.min(40, week);
    const attrs = biasedAttrs(() => rng.next(), tmpl.attrBias, catchupStats);

    const wId = rng.uuid('warrior');
    warriors.push(createRivalWarrior(wId, wName, style, attrs, stableId, tmpl.fameRange, rng));
  }
  return warriors;
}
