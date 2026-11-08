/** §8 World counters — lifetime totals, graveyard, living population. */
import { getAllArenas } from '@/data/arenas';
import type { AlmanacInput, AlmanacStat } from './shared';

/** §8 World counters — lifetime bouts/deaths/retirements, graveyard size, living population. */
export function computeWorldStats(input: AlmanacInput): AlmanacStat[] {
  const dead = new Set(input.deadWarriorIds ?? []);
  const deadCount =
    dead.size || input.warriors.filter((w) => w.isDead || w.status === 'Dead').length;
  const totalBouts = input.lifetimeStats?.bouts ?? (input.arenaHistory ?? []).length;
  const living = input.warriors.filter(
    (w) => !w.isDead && w.status !== 'Dead' && !dead.has(w.id as string)
  ).length;
  const stats: AlmanacStat[] = [
    { label: 'Total Bouts', value: totalBouts },
    { label: 'Total Deaths', value: deadCount },
    {
      label: 'Total Retirements',
      value:
        input.lifetimeStats?.retirements ??
        input.warriors.filter((w) => w.status === 'Retired').length,
    },
    { label: 'Warriors Living', value: living },
    { label: 'Recorded Bouts', value: (input.arenaHistory ?? []).length },
    { label: 'Stables', value: (input.stables ?? []).length },
    { label: 'Arenas', value: getAllArenas().length },
    {
      label: 'Tournaments Completed',
      value: (input.tournaments ?? []).filter((t) => t.completed).length,
    },
    {
      label: 'Death Rate',
      value: totalBouts > 0 ? `${((deadCount / totalBouts) * 100).toFixed(2)}%` : '0%',
    },
  ];
  if ((input.killEvents ?? []).length > 0) {
    stats.push({ label: 'Kill Events', value: (input.killEvents ?? []).length });
  }
  if (input.year !== undefined) stats.push({ label: 'Year', value: input.year });
  if (input.week !== undefined) stats.push({ label: 'Week', value: input.week });
  return stats;
}
