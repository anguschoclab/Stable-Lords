export interface BoutBid {
  proposingWarriorId: string;
  targetStableId?: string; // Specific ID for VENDETTA
  targetWarriorId?: string;
  minFame?: number;
  maxFame?: number;
  priority: number; // 1-10
  description?: string;
}
