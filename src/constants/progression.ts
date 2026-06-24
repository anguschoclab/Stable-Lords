import type { ProgressionState } from '@/types/state.types';

export const DEFAULT_PROGRESSION: ProgressionState = {
  status: 'active',
  stableStanding: 0,
  totalStables: 0,
  objectives: [
    {
      id: 'TOP_10_STABLE',
      label: 'Reach Top 10',
      description: 'Rank among the top 10 stables in the realm',
      completed: false,
    },
    {
      id: 'TOP_3_STABLE',
      label: 'Reach Top 3',
      description: 'Rank among the top 3 stables in the realm',
      completed: false,
    },
    {
      id: 'FIRST_TOURNAMENT_WIN',
      label: 'Tournament Victor',
      description: 'Win a tournament with one of your warriors',
      completed: false,
    },
    {
      id: 'HALL_OF_FAMER',
      label: 'Hall of Famer',
      description: 'Have a warrior win Warrior of the Year or Killer of the Year',
      completed: false,
    },
    {
      id: 'REALM_CHAMPION',
      label: 'Realm Champion',
      description: 'Finish a year as the #1 stable in the realm',
      completed: false,
    },
  ],
};
