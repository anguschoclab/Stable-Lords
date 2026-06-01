/**
 * Defines the shape of derived rivalry.
 */
export interface DerivedRivalry {
  stableName: string;
  ownerId: string;
  intensity: number;
  kills: { killer: string; victim: string; week: number }[];
  bouts: number;
  playerWins: number;
  playerLosses: number;
}
