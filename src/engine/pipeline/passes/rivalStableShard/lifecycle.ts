import type { RivalStableData, Warrior } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { driftCompetence } from '@/engine/ai/competence';

/**
 * Builds an index mapping stableId → first famous retired warrior (fame > 200).
 * Replaces per-rival O(N) find() scans with O(1) map lookups.
 */
export function buildSuccessorIndex(retired: Warrior[] | undefined): Map<StableId, Warrior> {
  const index = new Map<StableId, Warrior>();
  for (const w of retired || []) {
    if ((w.fame || 0) > 200 && w.stableId && !index.has(w.stableId)) {
      index.set(w.stableId, w);
    }
  }
  return index;
}

/**
 * 🎂 Owner Lifecycle: Handles annual aging and generational succession.
 */
export function handleOwnerLifecycle(
  rival: RivalStableData,
  nextWeek: number,
  rng: IRNGService,
  successorByStable: Map<StableId, Warrior>,
  absoluteWeek?: number
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const updatedRival = { ...rival, owner: { ...rival.owner } };
  const gazetteItems: string[] = [];

  // 1. Annual Aging (Occurs on Week 1)
  if (nextWeek === 1) {
    updatedRival.owner.age = (updatedRival.owner.age || 40) + 1;
  }

  // 2. Succession Logic (Starts at age 65, becomes likely by 75)
  const age = updatedRival.owner.age || 40;
  const retirementChance = age < 65 ? 0 : age < 75 ? 0.05 : 0.2;

  if (rng.next() < retirementChance) {
    const generation = (updatedRival.owner.generation || 0) + 1;
    const oldName = updatedRival.owner.name;

    // 🏆 Successor Hunt: O(1) lookup via pre-built index
    const successorCandidate = successorByStable.get(updatedRival.id);

    const newName = successorCandidate
      ? successorCandidate.name
      : `Lord ${updatedRival.owner.stableName.split(' ')[0]} ${'I'.repeat(generation + 1)}`;

    updatedRival.owner = {
      ...updatedRival.owner,
      name: newName,
      age: 25 + Math.floor(rng.next() * 15),
      generation,
      fame: Math.floor(updatedRival.owner.fame * 0.4), // Fame reset on new leadership
      backstoryId: undefined, // Fresh start
      ageRetired: absoluteWeek ?? nextWeek, // Week the previous owner retired
      competence: driftCompetence(rival.owner.competence, rng),
    };

    gazetteItems.push(
      `👑 SUCCESSION: ${oldName} has retired from ${updatedRival.owner.stableName}. ${newName} takes the mantle (Generation ${generation})!`
    );
  }

  return { updatedRival, gazetteItems };
}
