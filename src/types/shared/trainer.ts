import { FightingStyle } from './fightingStyles';
import type { TrainerFocus, TrainerSpecialty, TrainerTier } from './trainerTypes';



/**
 * Defines the shape of trainer.
 */
export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  age: number;
  contractWeeksLeft: number; // 0 = expired
  retiredFromWarrior?: string; // warrior name if converted
  retiredFromStyle?: FightingStyle;
  styleBonusStyle?: FightingStyle; // bonus for warriors of this style
  legacyWins?: number;
  legacyKills?: number;
  specialty?: TrainerSpecialty;
}
