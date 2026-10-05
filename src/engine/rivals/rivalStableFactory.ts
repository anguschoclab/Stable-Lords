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
import type { RivalStableData, Owner, WorldDifficulty } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { StableTemplate } from '@/data/templates';
import type { StableId } from '@/types/shared.types';
import { ALL_TEMPLATES } from '@/data/templates';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import { generateCrest } from '../crest/crestGenerator';
import { biasedAttrs, createRivalWarrior } from './rivalWarriorFactory';
import { generateStableTrainers } from './rivalTrainerFactory';
import { generateWarriorName } from '@/data/names/nameGenerator';
import { cultureForOwner } from '@/data/names/cultures';
import { rollCompetence } from '@/engine/ai/competence';

/**
 * Gets stable templates.
 */
export function getStableTemplates(): StableTemplate[] {
  return [...ALL_TEMPLATES];
}

/** Roman numerals for dynasty suffixes — II, III, ... (unbounded). */
export function toRomanNumeral(n: number): string {
  const table: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let rest = n;
  for (const [value, glyph] of table) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

const STABLE_SUFFIX_RE = / \[[IVXLCDM]+\]$/;

/**
 * First free dynasty name for a template stable: the minted copy becomes
 * `Name [II]`, `[III]`, ... `startAt` shifts the scan origin so same-week
 * mints (each seeded by shard index) land on different suffixes.
 */
export function uniqueStableName(
  base: string,
  used: ReadonlySet<string>,
  startAt = 2
): string {
  if (!used.has(base)) return base;
  const stem = base.replace(STABLE_SUFFIX_RE, '');
  for (let n = Math.max(2, startAt); ; n++) {
    const candidate = `${stem} [${toRomanNumeral(n)}]`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * First free owner name following the factory's `${name} B` convention for
 * the second living copy (C, D, ...), numerals beyond Z.
 */
export function uniqueOwnerName(
  base: string,
  used: ReadonlySet<string>,
  startAt = 2
): string {
  if (!used.has(base)) return base;
  for (let n = Math.max(2, startAt); ; n++) {
    const candidate = `${base} ${n <= 26 ? String.fromCharCode(64 + n) : toRomanNumeral(n)}`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * Generate rival stables from templates.
 * Scaling: Provides bonus gold and stats for expansion stables joining mid-game.
 */
export function generateRivalStables(
  count: number,
  seed: number,
  week: number = 0,
  seedNames?: ReadonlySet<string>,
  opts?: { difficulty?: WorldDifficulty }
): RivalStableData[] {
  const rng = new SeededRNGService(seed);
  // Pre-seeded with the world's used names when a mid-game caller passes them —
  // otherwise regenerated stables re-mint names already carried by the living.
  const usedWarriorNames = new Set<string>(seedNames ?? []);
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
    rivals.push(
      buildRivalStable({
        tmpl: item.tmpl,
        iteration: item.iteration,
        week,
        rng,
        usedWarriorNames,
        difficulty: opts?.difficulty,
      })
    );
  }
  return rivals;
}

interface BuildOwnerArgs {
  tmpl: StableTemplate;
  stableId: StableId;
  iteration: number;
  stableName: string;
  rng: IRNGService;
  difficulty?: WorldDifficulty;
}

/** Build the stable's owner — procedural name/fame/titles for duplicates. */
function buildOwner(args: BuildOwnerArgs): Owner {
  const { tmpl, stableId, iteration, stableName, rng, difficulty } = args;
  return {
    id: stableId,
    name:
      iteration > 0
        ? `${tmpl.ownerName} ${String.fromCharCode(64 + iteration + 1)}`
        : tmpl.ownerName,
    stableName: stableName,
    fame: tmpl.fameRange[0] + Math.floor(rng.next() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
    renown: tmpl.tier === 'Legendary' ? 5 : tmpl.tier === 'Major' ? 2 : 0,
    titles:
      tmpl.tier === 'Legendary'
        ? 2 + Math.floor(rng.next() * 3)
        : tmpl.tier === 'Major'
          ? Math.floor(rng.next() * 3)
          : 0,
    personality: tmpl.personality,
    metaAdaptation: tmpl.metaAdaptation,
    competence: rollCompetence(rng, tmpl.tier, difficulty),
    favoredStyles: tmpl.preferredStyles,
    backstoryId: tmpl.backstoryId,
  };
}

interface BuildRivalStableArgs {
  tmpl: StableTemplate;
  iteration: number;
  week: number;
  rng: IRNGService;
  usedWarriorNames: Set<string>;
  difficulty?: WorldDifficulty;
}

/** Build one rival stable from a template pick. */
function buildRivalStable(args: BuildRivalStableArgs): RivalStableData {
  const { tmpl, iteration, week, rng, usedWarriorNames, difficulty } = args;
  const stableId = rng.uuid() as StableId;

  // Procedural name variance for duplicates
  const nameSuffix = iteration > 0 ? ` [${toRomanNumeral(iteration + 1)}]` : '';
  const stableName = `${tmpl.stableName}${nameSuffix}`;
  const owner = buildOwner({ tmpl, stableId, iteration, stableName, rng, difficulty });

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
    const preferred = tmpl.preferredStyles[Math.floor(rng.next() * tmpl.preferredStyles.length)];
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
  const culture = cultureForOwner(tmpl.personality, tmpl.philosophy);

  for (let j = 0; j < warriorCount; j++) {
    const wName = generateWarriorName({
      rng,
      culture,
      seedPool: tmpl.warriorNames,
      usedNames: usedWarriorNames,
    });
    usedWarriorNames.add(wName);

    const style = pickWarriorStyle(tmpl, rng);

    // Catch-up Attribute Scaling: +1 point per week (cap +40)
    const catchupStats = Math.min(40, week);
    const attrs = biasedAttrs(() => rng.next(), tmpl.attrBias, catchupStats);

    const wId = rng.uuid('warrior');
    warriors.push(createRivalWarrior({ wId: wId, wName: wName, style: style, attrs: attrs, stableId: stableId, fameRange: tmpl.fameRange, rng: rng }));
  }
  return warriors;
}
