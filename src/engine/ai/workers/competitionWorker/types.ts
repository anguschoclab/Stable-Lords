/**
 *
 */
export interface BoutBid {
  proposingWarriorId: string;
  targetStableId?: string; // Specific ID for VENDETTA
  targetWarriorId?: string;
  /** Pinned venue for CROWN_CAMPAIGN bids — climbs the target arena's ladder. */
  arenaId?: string;
  minFame?: number;
  maxFame?: number;
  priority: number; // 1-10
  description?: string;
}
