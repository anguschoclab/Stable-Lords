import type {
  ConditionTriggerType,
  OffensiveTactic,
  DefensiveTactic,
  PsychState,
} from '@/types/game';

export const TRIGGER_OPTIONS: {
  label: string;
  type: ConditionTriggerType;
  inputType: 'percent' | 'integer' | 'phase' | 'psych';
}[] = [
  { label: 'HP Below', type: 'HP_BELOW', inputType: 'percent' },
  { label: 'HP Above', type: 'HP_ABOVE', inputType: 'percent' },
  { label: 'Endurance Below', type: 'ENDURANCE_BELOW', inputType: 'percent' },
  { label: 'Momentum Lead', type: 'MOMENTUM_LEAD', inputType: 'integer' },
  { label: 'Momentum Deficit', type: 'MOMENTUM_DEFICIT', inputType: 'integer' },
  { label: 'Phase Is', type: 'PHASE_IS', inputType: 'phase' },
  { label: 'Opponent HP Below', type: 'OPPONENT_HP_BELOW', inputType: 'percent' },
  { label: 'Opponent Gassed', type: 'OPPONENT_ENDURANCE_BELOW', inputType: 'percent' },
  { label: 'Opponent Tempo', type: 'OPPONENT_MOMENTUM_LEAD', inputType: 'integer' },
  { label: 'Opponent Repeats', type: 'OPPONENT_TACTIC_STREAK', inputType: 'integer' },
  { label: 'My State Is', type: 'PSYCH_IS', inputType: 'psych' },
];

export const PSYCH_OPTIONS: PsychState[] = [
  'Neutral',
  'InTheZone',
  'Cruising',
  'Rattled',
  'Desperate',
  'FatiguePanic',
];

export const OFFENSIVE_TACTICS: { label: string; value: OffensiveTactic }[] = [
  { label: '—', value: 'none' },
  { label: 'Lunge', value: 'Lunge' },
  { label: 'Slash', value: 'Slash' },
  { label: 'Bash', value: 'Bash' },
  { label: 'Decisiveness', value: 'Decisiveness' },
];

export const DEFENSIVE_TACTICS: { label: string; value: DefensiveTactic }[] = [
  { label: '—', value: 'none' },
  { label: 'Dodge', value: 'Dodge' },
  { label: 'Parry', value: 'Parry' },
  { label: 'Riposte', value: 'Riposte' },
  { label: 'Responsiveness', value: 'Responsiveness' },
];
