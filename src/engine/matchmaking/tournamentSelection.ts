import { generateSeasonalTiers, TOURNAMENT_TIERS } from './tournamentSelection/core';
import { committeeSelection, buildTournament } from './tournamentSelection/committee';
import { awardTournamentPrizes, modifyWarrior } from './tournamentSelection/awards';
import {
  resolveCompleteTournament,
  resolveRound,
  applyBoutResults,
} from './tournamentSelection/resolution';
import { findWarriorById, getAIPlan, generateFreelancer } from './tournamentSelection/utils';

export { TOURNAMENT_TIERS };/**
 * Tournament selection service.
 */


/**
 * Tournament selection service.
 */
export const TournamentSelectionService = {
  generateSeasonalTiers,
  committeeSelection,
  buildTournament,
  resolveRound,
  awardTournamentPrizes,
  modifyWarrior,
  resolveCompleteTournament,
  findWarriorById,
  getAIPlan,
  applyBoutResults,
  generateFreelancer,
};
