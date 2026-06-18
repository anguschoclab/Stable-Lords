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

  for (let i = 0; i < shuffled.length && i < 64; i += 2) {
    const wA = shuffled[i];
    const wD = shuffled[i + 1];
    if (!wA || !wD) break;
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      warriorIdA: wA.id,
      warriorIdD: wD.id,
      stableIdA: wA.stableId,
      stableIdD: wD.stableId,
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
