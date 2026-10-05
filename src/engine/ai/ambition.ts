/**
 * Owner ambition arcs (Stage C): ASCENDANT / PRIME / DECLINING — where the
 * owner sits in their competitive lifecycle. Derived from competence,
 * generation, age, and the current season's track record; consumed by the
 * season-plan pick (DECLINING stables consolidate rather than campaign)
 * and, later, by retirement/sell posture.
 */
import type { RivalStableData } from '@/types/state.types';
import { competenceQuality } from './competence';

export type AmbitionArc = 'ASCENDANT' | 'PRIME' | 'DECLINING';

const ASCENDANT_FLOOR = 1.0;
const DECLINING_CEILING = 0.45;

/**
 * Lifecycle score: competence quality + win-rate momentum + youth and
 * first-generation vigor, minus age and dynasty decay. Deterministic —
 * an arc is a read of the owner's position, not a dice roll.
 */
export function deriveAmbitionArc(rival: RivalStableData): AmbitionArc {
  const owner = rival.owner;
  const record = rival.agentMemory?.seasonRecord;
  const played = (record?.wins ?? 0) + (record?.losses ?? 0);
  const winRate = played > 0 ? (record!.wins ?? 0) / played : 0.5;

  const age = owner.age ?? 40;
  const generation = owner.generation ?? 0;

  let score = competenceQuality(owner) + winRate * 0.5;
  score += age < 40 ? 0.2 : age > 58 ? -0.4 : 0;
  score += generation === 0 ? 0.1 : -generation * 0.05;

  if (score >= ASCENDANT_FLOOR) return 'ASCENDANT';
  if (score <= DECLINING_CEILING) return 'DECLINING';
  return 'PRIME';
}
