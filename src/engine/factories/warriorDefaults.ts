import type { Warrior } from '@/types/warrior.types';

/**
 * Canonical zero-state fields for a newly minted warrior.
 *
 * Returns fresh containers per call — a shared constant would alias mutable
 * `titles`/`injuries`/`flair`/`career` across every warrior built from it.
 */
export function newWarriorDefaults(): Pick<
  Warrior,
  'fame' | 'popularity' | 'titles' | 'injuries' | 'flair' | 'career' | 'champion' | 'status'
> {
  return {
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
  };
}
