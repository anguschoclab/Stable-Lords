/**
 * FightSummary Factory
 * Eliminates DRY violation of FightSummary object construction in tournament resolvers
 */
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { FightSummary } from '@/types/state.types';
import type { FightId, TournamentId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';

/**
 * Defines the shape of fight summary params.
 */
export interface FightSummaryParams {
  warriorA: Warrior;
  warriorD: Warrior;
  outcome: FightOutcome;
  week: number;
  tournamentId?: string;
  tournamentName?: string;
  rng: { uuid: (prefix?: string) => string } | IRNGService;
}

/**
 * Creates a standardized FightSummary object
 * Used by both tournament resolution systems to ensure consistency
 */
export function createFightSummary(params: FightSummaryParams): FightSummary {
  const { warriorA, warriorD, outcome, week, tournamentId, tournamentName, rng } = params;

  // Generate unique ID
  const id = (
    typeof rng.uuid === 'function' ? rng.uuid('bout') : (rng as IRNGService).uuid()
  ) as FightId;

  // Build title
  const title = tournamentName
    ? `${warriorA.name} vs ${warriorD.name} (${tournamentName})`
    : `${warriorA.name} vs ${warriorD.name}`;

  // Extract transcript from outcome log
  const transcript = outcome.log?.map((e) => e.text || '') || [];

  // Build fight analysis
  const zeroSkills = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 };
  const analysis = buildFightAnalysis(
    outcome,
    {
      id: warriorA.id,
      name: warriorA.name,
      style: warriorA.style,
      attributes: warriorA.attributes,
      skills: warriorA.baseSkills ?? zeroSkills,
    },
    {
      id: warriorD.id,
      name: warriorD.name,
      style: warriorD.style,
      attributes: warriorD.attributes,
      skills: warriorD.baseSkills ?? zeroSkills,
    }
  );

  return {
    id,
    week,
    phase: 'resolution',
    tournamentId: tournamentId as TournamentId | undefined,
    title,
    warriorIdA: warriorA.id,
    warriorIdD: warriorD.id,
    stableIdA: warriorA.stableId,
    stableIdD: warriorD.stableId,
    winner: outcome.winner,
    by: outcome.by,
    styleA: warriorA.style,
    styleD: warriorD.style,
    transcript,
    analysis,
    createdAt: new Date(Date.UTC(2026, 0, 1) + (week - 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Convenience function for non-tournament bouts
 */
export function createBoutSummary(
  warriorA: Warrior,
  warriorD: Warrior,
  outcome: FightOutcome,
  week: number,
  rng: { uuid: (prefix?: string) => string } | IRNGService
): FightSummary {
  return createFightSummary({
    warriorA,
    warriorD,
    outcome,
    week,
    rng,
  });
}

/**
 * Creates a minimal fight summary for arena history
 * Used when full bout details aren't needed
 */
export function createMinimalFightSummary(
  warriorA: Warrior,
  warriorD: Warrior,
  winner: 'A' | 'D' | null,
  by: FightOutcome['by'],
  week: number,
  rng: { uuid: (prefix?: string) => string } | IRNGService
): FightSummary {
  const id = (
    typeof rng.uuid === 'function' ? rng.uuid('bout') : (rng as IRNGService).uuid()
  ) as FightId;

  return {
    id,
    week,
    phase: 'resolution',
    title: `${warriorA.name} vs ${warriorD.name}`,
    warriorIdA: warriorA.id,
    warriorIdD: warriorD.id,
    stableIdA: warriorA.stableId,
    stableIdD: warriorD.stableId,
    winner,
    by,
    styleA: warriorA.style,
    styleD: warriorD.style,
    transcript: [],
    createdAt: new Date(Date.UTC(2026, 0, 1) + (week - 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
