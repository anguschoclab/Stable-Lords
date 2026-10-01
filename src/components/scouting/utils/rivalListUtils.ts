import type { RivalStableData } from '@/types/game';
import type { SortOption } from '@/hooks/useListShell';

const TIER_RANK: Record<string, number> = {
  Legendary: 3,
  Major: 2,
  Established: 1,
  Minor: 0,
};

/** Canonical sort options for rival-stable lists. */
export const RIVAL_SORTS: SortOption<RivalStableData>[] = [
  {
    id: 'name',
    label: 'Name',
    compare: (a, b) => a.owner.stableName.localeCompare(b.owner.stableName),
  },
  {
    id: 'tier',
    label: 'Tier',
    compare: (a, b) =>
      (TIER_RANK[b.tier ?? 'Minor'] ?? 0) - (TIER_RANK[a.tier ?? 'Minor'] ?? 0),
  },
  {
    id: 'roster',
    label: 'Roster',
    compare: (a, b) => b.roster.length - a.roster.length,
  },
  {
    id: 'treasury',
    label: 'Treasury',
    compare: (a, b) => b.treasury - a.treasury,
  },
];

/** Search surface for a rival stable — name, owner, tier, doctrine. */
export function rivalSearchText(r: RivalStableData): string[] {
  return [
    r.owner.stableName,
    r.owner.name ?? '',
    r.tier ?? '',
    r.philosophy ?? '',
    r.owner.personality ?? '',
  ];
}
