export {
  TOTAL_CAP,
  BASE_GAIN_CHANCE,
  SEASONAL_CAP_PER_ATTR,
  BASE_TRAINING_INJURY_CHANCE,
  GAIN_CHANCE_MIN,
  GAIN_CHANCE_MAX,
  INJURY_CHANCE_MIN,
  INJURY_CHANCE_MAX,
  SKILL_DRILL_CAP,
  SKILL_DRILL_BASE_CHANCE,
  SKILL_DRILL_GAIN_MIN,
  SKILL_DRILL_GAIN_MAX,
  SKILL_TRAINER_FOCUS,
  TRAINING_INJURIES,
} from './trainingGains/constants';
export type { TrainingResult } from './trainingGains/types';
export { computeGainChance, processAttributeTraining } from './trainingGains/attributeTraining';
export { computeSkillDrillChance, processSkillDrillTraining } from './trainingGains/skillDrilling';
export { rollForTrainingInjury, processRecovery } from './trainingGains/injuryAndRecovery';
