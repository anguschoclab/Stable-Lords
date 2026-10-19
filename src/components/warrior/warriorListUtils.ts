import type { SortOption } from '@/hooks/useListShell';
import { STYLE_DISPLAY_NAMES, type FightingStyle } from '@/types/shared.types';

/** Minimal warrior row for search/sort — both Warrior and projections satisfy it. */
interface WarriorLike {
  name: string;
  epithet?: string;
  style?: string;
  fame?: number;
  age?: number;
  career?: { wins: number; losses: number };
}

/** Search surface for a warrior — name, earned epithet, style display name. */
export function warriorSearchText(w: WarriorLike): string[] {
  return [
    w.name,
    w.epithet ?? '',
    w.style ? (STYLE_DISPLAY_NAMES[w.style as FightingStyle] ?? w.style) : '',
  ];
}

/** Canonical sort options for warrior lists (fame default matches roster order). */
export const WARRIOR_SORTS: SortOption<WarriorLike>[] = [
  {
    id: 'fame',
    label: 'Fame',
    compare: (a, b) => (b.fame ?? 0) - (a.fame ?? 0),
  },
  {
    id: 'name',
    label: 'Name',
    compare: (a, b) => a.name.localeCompare(b.name),
  },
  {
    id: 'wins',
    label: 'Record',
    compare: (a, b) => (b.career?.wins ?? 0) - (a.career?.wins ?? 0),
  },
  {
    id: 'age',
    label: 'Age',
    compare: (a, b) => (b.age ?? 0) - (a.age ?? 0),
  },
];
