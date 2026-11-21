/** Leaderboard row for one warrior — record, fame, composite ranking. */
export interface WarriorRow {
  id: string;
  name: string;
  stableName: string;
  stableId: string;
  fame: number;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
  style: string;
  isPlayer: boolean;
  officialRank: number;
  compositeScore: number;
}

/** Rankings row for one stable — aggregate record, tier, motto. */
export interface StableRow {
  id: string;
  name: string;
  ownerName: string;
  fame: number;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
  roster: number;
  tier: string;
  motto: string;
  isPlayer: boolean;
}
