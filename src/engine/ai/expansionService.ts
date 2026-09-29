import type { GameState, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { generateRivalStables } from '../rivals';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { inheritCrest } from '../crest/crestGenerator';
import { BACKSTORIES } from '@/data/backstories';
import type { FightingStyle } from '@/types/shared.types';
import { INITIAL_RIVAL_COUNT } from '@/constants/economy';

/**
 * ExpansionService - Handles stable expansion.
 * Manages generation of new rival stables.
 */
type LegacyCandidate = {
  name: string;
  stableName: string;
  parentStableId?: string;
  warriorId?: string;
  fightingStyle?: FightingStyle;
};

/**
 * Overlay a retired-warrior legacy founder onto a freshly generated stable:
 * owner identity, personality/favored-style derivation from the gladiator
 * backstory weights, and crest inheritance from the parent stable.
 */
function applyLegacyFounder(
  newStable: RivalStableData,
  legacy: LegacyCandidate,
  rivalsById: Map<string, RivalStableData>,
  rng: IRNGService
): void {
  // Set legacy founder details
  newStable.owner.name = legacy.name;
  newStable.owner.stableName = legacy.stableName;
  newStable.owner.backstoryId = 'gladiator'; // Legacy founders are former arena warriors
  newStable.owner.foundedByWarriorId =
    legacy.warriorId as import('@/types/shared.types').WarriorId;
  // Derive personality/favoredStyles from the backstory seed + warrior's style
  // rather than hardcoding "Aggressive" for every legacy founder.
  const seedBasis = legacy.warriorId ?? legacy.name;
  const seedRng = new SeededRNGService(
    seedBasis.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );
  const gladDef = BACKSTORIES.gladiator;
  const personalityEntries = Object.entries(gladDef.identitySeed.personalityWeights) as [
    NonNullable<typeof newStable.owner.personality>,
    number,
  ][];
  const totalP = personalityEntries.reduce((s, [, w]) => s + w, 0);
  let rollP = seedRng.next() * totalP;
  for (const [key, w] of personalityEntries) {
    rollP -= w;
    if (rollP <= 0) {
      newStable.owner.personality = key;
      break;
    }
  }
  if (legacy.fightingStyle) {
    newStable.owner.favoredStyles = [legacy.fightingStyle];
  }

  // Find parent stable for crest inheritance
  let parentCrest = undefined;
  let parentGeneration = 0;

  if (legacy.parentStableId) {
    const parentStable = rivalsById.get(
      legacy.parentStableId as import('@/types/shared.types').StableId
    );
    if (parentStable?.crest) {
      parentCrest = parentStable.crest;
      parentGeneration = parentStable.owner?.generation ?? 0;
    }
  }

  // Inherit or generate crest
  if (parentCrest) {
    const crestSeed = Math.floor(rng.next() * 100000);
    newStable.crest = inheritCrest(parentCrest, crestSeed);
    newStable.owner.generation = parentGeneration + 1;
  } else {
    // Generate new crest for legacy founder without parent
    const crestSeed = Math.floor(rng.next() * 100000);
    const baseCrest = newStable.crest;
    if (baseCrest) {
      newStable.crest = inheritCrest(baseCrest, crestSeed);
    }
    newStable.owner.generation = 1;
  }
}

export const ExpansionService = {
  /**
   * Processes expansion by generating new rival stables.
   * Adds new stables to maintain world population.
   * Supports crest inheritance for legacy stables (retired warriors founding new stables).
   */
  processExpansion(
    state: GameState,
    rng: IRNGService,
    targetCount: number = INITIAL_RIVAL_COUNT,
    legacyCandidates?: LegacyCandidate[]
  ): { updatedState: GameState; newStables: RivalStableData[] } {
    const updatedState = { ...state };
    const currentCount = updatedState.rivals?.length || 0;

    if (currentCount >= targetCount) {
      return { updatedState, newStables: [] };
    }

    const neededCount = targetCount - currentCount;
    const newStables: RivalStableData[] = [];
    // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
    const rivalsById = new Map<string, RivalStableData>();
    for (const r of state.rivals || []) {
      rivalsById.set(r.id, r);
    }

    const usedWarriorIds = collectUsedWarriorIds(state);
    const usedNames = collectUsedWarriorNames(state);

    for (let i = 0; i < neededCount; i++) {
      if (rng.next() < 0.3) {
        const legacy = legacyCandidates?.shift();
        // Minted ids derive from the seed — a colliding seed re-mints a
        // byte-identical clone of a live stable, conflating every id-keyed
        // update. Re-roll until the stable is genuinely new.
        let newStable: RivalStableData | undefined;
        for (let attempt = 0; attempt < 8 && !newStable; attempt++) {
          const candidate = generateRivalStables(
            1,
            Math.floor(rng.next() * 10001),
            state.week,
            usedNames
          )[0];
          if (!candidate) break;
          if (
            rivalsById.has(candidate.id) ||
            candidate.roster.some((w) => usedWarriorIds.has(w.id))
          ) {
            continue;
          }
          newStable = candidate;
        }

        if (newStable && legacy) {
          applyLegacyFounder(newStable, legacy, rivalsById, rng);
        }

        if (newStable) {
          rivalsById.set(newStable.id, newStable);
          for (const w of newStable.roster) {
            usedWarriorIds.add(w.id);
            usedNames.add(w.name);
          }
          newStables.push(newStable);
        }
      }
    }

    updatedState.rivals = [...(updatedState.rivals || []), ...newStables];

    return { updatedState, newStables };
  },
} as const;
