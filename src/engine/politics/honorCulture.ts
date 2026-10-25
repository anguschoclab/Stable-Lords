/**
 * Arena honor culture (canon: Andorian arenas frown on down-challenges).
 *
 * A "down-challenge" is challenging a warrior with markedly fewer recognition
 * points than yourself (fame is the recognition proxy here). In an
 * honor-bound venue the crowd remembers: proposers who pick on lesser names
 * earn stigma in the gazette and the slighted stable's grudge runs deeper.
 */
import type { Warrior } from '@/types/warrior.types';
import { getArenaById, arenaTagSet } from '@/data/arenas/registry';

/** Fame gap that makes a challenge read as punching down. */
export const HONOR_DOWN_CHALLENGE_MARGIN = 25;
/** Pairwise score penalty for AI proposers down-challenging in an honor venue. */
export const AI_DOWN_CHALLENGE_PENALTY = 60;

/** True when the venue's honor culture frowns on down-challenges. */
export function arenaIsHonorBound(arenaId: string | undefined): boolean {
  if (!arenaId) return false;
  try {
    return arenaTagSet(getArenaById(arenaId)).has('honor-bound');
  } catch {
    return false;
  }
}

/**
 * True when `proposer` challenging `target` reads as punching down:
 * the proposer's recognition exceeds the target's by a clear margin.
 */
export function isDownChallenge(proposer: Warrior, target: Warrior): boolean {
  return (proposer.fame ?? 0) - (target.fame ?? 0) > HONOR_DOWN_CHALLENGE_MARGIN;
}
