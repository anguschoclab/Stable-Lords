import type { Warrior, TournamentEntry, TournamentBout, Season } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService'; /**
                                                                   * Defines the shape of tournament bracket config.
                                                                   */

/**
 * Defines the shape of tournament bracket config.
 */
export interface TournamentBracketConfig {
  tierId: string;
  tierName: string;
  warriors: Warrior[];
  week: number;
  season: Season;
  rng: IRNGService;
} /**
   * Defines the shape of bracket match.
   */

/**
 * Defines the shape of bracket match.
 */
/**
 * Builds a tournament bracket from selected warriors.
 * Creates a 64-warrior single-elimination bracket.
 */
export function buildTournament(config: TournamentBracketConfig): TournamentEntry {
  const { tierId, tierName, warriors, week, season, rng } = config;
  const rngService = rng;
  const id = `t-${tierId.toLowerCase()}-${season.toLowerCase()}-${week}` as TournamentId;
  const shuffled = rngService.shuffle([...warriors]);
  const bracket: TournamentBout[] = [];

  for (let i = 0; i < 64; i += 2) {
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      warriorIdA: shuffled[i]!.id,
      warriorIdD: shuffled[i + 1]!.id,
      stableIdA: shuffled[i]!.stableId,
      stableIdD: shuffled[i + 1]!.stableId,
    });
  }

  return {
    id,
    season,
    week,
    tierId,
    name: tierName,
    bracket,
    participants: warriors,
    completed: false,
  };
}
