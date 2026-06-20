import type { RosterSlice } from './types';

export const defaultRosterState: Omit<
  RosterSlice,
  | 'setRoster'
  | 'addWarrior'
  | 'killWarrior'
  | 'retireWarrior'
  | 'releaseWarrior'
  | 'consumeInsightToken'
  | 'updateWarriorEquipment'
  | 'renameWarrior'
  | 'acknowledgeDeath'
> = {
  roster: [],
  graveyard: [],
  retired: [],
  recruitPool: [],
  insightTokens: [],
  trainers: [],
  hiringPool: [],
  trainingAssignments: [],
  seasonalGrowth: [],
  restStates: [],
  rosterBonus: 0,
  unacknowledgedDeaths: [],
};
