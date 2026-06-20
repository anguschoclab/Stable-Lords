import {
  Warrior,
  PoolWarrior,
  DeathEvent,
  InsightToken,
  Trainer,
  TrainingAssignment,
  SeasonalGrowth,
  RestState,
} from '@/types/state.types';
import { type WarriorId, type InsightId } from '@/types/shared.types';

export interface RosterSlice {
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  recruitPool: PoolWarrior[];
  insightTokens: InsightToken[];
  trainers: Trainer[];
  hiringPool: Trainer[];
  trainingAssignments: TrainingAssignment[];
  seasonalGrowth: SeasonalGrowth[];
  restStates: RestState[];
  rosterBonus: number;
  unacknowledgedDeaths: WarriorId[];
  setRoster: (roster: Warrior[]) => void;
  addWarrior: (warrior: Warrior) => void;
  killWarrior: (
    warriorId: WarriorId,
    killedBy: string,
    cause: string,
    deathEvent?: DeathEvent
  ) => void;
  retireWarrior: (warriorId: WarriorId) => void;
  releaseWarrior: (warriorId: WarriorId, reason?: string) => void;
  consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => void;
  updateWarriorEquipment: (
    warriorId: WarriorId,
    equipment: { weapon: string; armor: string; shield: string; helm: string }
  ) => void;
  renameWarrior: (warriorId: WarriorId, newName: string) => void;
  acknowledgeDeath: (warriorId: WarriorId) => void;
}
