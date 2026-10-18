/** Destination and label for returning from a warrior dossier. */
export interface WarriorReturnContext {
  to: string;
  label: string;
}

/** Canonical parent for the warrior dossier based on the actual owner. */
export function getWarriorReturnContext(args: {
  isPlayerOwned: boolean;
  ownerStableId?: string;
}): WarriorReturnContext {
  if (args.isPlayerOwned) {
    return { to: '/stable/roster', label: 'Back to Roster' };
  }
  if (args.ownerStableId) {
    return { to: `/world/stable/${args.ownerStableId}`, label: 'Back to Stable' };
  }
  return { to: '/world/scouting', label: 'Back to Scouting' };
}
