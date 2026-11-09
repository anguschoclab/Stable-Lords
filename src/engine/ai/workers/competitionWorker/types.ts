/**
 *
 */
export interface BoutBid {
  proposingWarriorId: string;
  targetStableId?: string; // Specific ID for VENDETTA / bloodfeud
  targetWarriorId?: string;
  /** V26: a bloodfeud entitlement bid — the owed stable hunts its mark's
   *  killer. Outranks every intent (an entitlement, not a posture). */
  bloodfeud?: boolean;
  /** Pinned venue for CROWN_CAMPAIGN bids — climbs the target arena's ladder. */
  arenaId?: string;
  minFame?: number;
  maxFame?: number;
  priority: number; // 1-10
  description?: string;
}
