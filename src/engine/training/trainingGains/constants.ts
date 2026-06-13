import { type BaseSkills } from '@/types/shared.types';
import { type TrainerFocus } from '@/types/shared.types';

export const TOTAL_CAP = 120;
export const BASE_GAIN_CHANCE = 0.55;
export const SEASONAL_CAP_PER_ATTR = 3;
export const BASE_TRAINING_INJURY_CHANCE = 0.03;
export const GAIN_CHANCE_MIN = 0.15;
export const GAIN_CHANCE_MAX = 0.85;
export const INJURY_CHANCE_MIN = 0.01;
export const INJURY_CHANCE_MAX = 0.1;

export const SKILL_DRILL_CAP = 3;
export const SKILL_DRILL_BASE_CHANCE = 0.4;
export const SKILL_DRILL_GAIN_MIN = 0.15;
export const SKILL_DRILL_GAIN_MAX = 0.7;

export const SKILL_TRAINER_FOCUS: Record<keyof BaseSkills, TrainerFocus> = {
  ATT: 'Aggression',
  PAR: 'Defense',
  DEF: 'Defense',
  INI: 'Mind',
  RIP: 'Aggression',
  DEC: 'Mind',
};

export const TRAINING_INJURIES = [
  {
    name: 'Pulled Muscle',
    description: 'Overextended during drills.',
    penalties: { ST: -1 },
    weeksRange: [1, 2],
  },
  {
    name: 'Twisted Knee',
    description: 'Bad footing on the training ground.',
    penalties: { SP: -1 },
    weeksRange: [1, 2],
  },
  {
    name: 'Sparring Cut',
    description: 'A careless training partner.',
    penalties: { CN: -1 },
    weeksRange: [1, 1],
  },
  {
    name: 'Strained Back',
    description: 'Lifted too heavy in the yard.',
    penalties: { ST: -1, CN: -1 },
    weeksRange: [2, 3],
  },
  {
    name: 'Practice Concussion',
    description: 'Took a hard knock to the head.',
    penalties: { WT: -1 },
    weeksRange: [2, 3],
  },
];
