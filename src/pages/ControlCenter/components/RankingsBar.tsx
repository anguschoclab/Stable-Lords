import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Trophy, Star } from 'lucide-react';

/**
 *
 */
export function RankingsBar() {
  const { roster, fame, rivals, realmRankings } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      fame: s.fame,
      rivals: s.rivals,
      realmRankings: s.realmRankings,
    }))
  );

  const stableRank = useMemo(() => {
    if (!rivals || rivals.length === 0) return null;
    const higherCount = rivals.filter((r) => (r.fame ?? 0) > (fame ?? 0)).length;
    return higherCount + 1;
  }, [rivals, fame]);

  const topWarriorRank = useMemo(() => {
    if (!realmRankings || Object.keys(realmRankings).length === 0) return null;
    let best: number | null = null;
    for (const w of roster) {
      const entry = realmRankings[w.id];
      if (entry && entry.overallRank > 0) {
        if (best === null || entry.overallRank < best) {
          best = entry.overallRank;
        }
      }
    }
    return best;
  }, [roster, realmRankings]);

  const items = [
    {
      label: 'Stable Rank',
      value: stableRank !== null ? `#${stableRank}` : '—',
      icon: Trophy,
      color: stableRank === 1 ? 'text-arena-gold' : 'text-arena-fame',
      glow: stableRank === 1 ? 'shadow-[0_0_10px_rgba(212,175,55,0.15)]' : '',
      sub: stableRank !== null ? `of ${rivals.length + 1} stables` : 'No rivals yet',
    },
    {
      label: 'Top Warrior Rank',
      value: topWarriorRank !== null ? `#${topWarriorRank}` : '—',
      icon: Star,
      color: topWarriorRank !== null && topWarriorRank <= 10 ? 'text-arena-gold' : 'text-primary',
      glow:
        topWarriorRank !== null && topWarriorRank <= 3
          ? 'shadow-[0_0_10px_rgba(212,175,55,0.15)]'
          : '',
      sub: topWarriorRank !== null ? 'overall realm ranking' : 'Rankings not yet set',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, icon: Icon, color, glow, sub }) => (
        <Surface key={label} variant="glass" className={cn('p-4 flex items-center gap-4', glow)}>
          <Icon className={cn('h-5 w-5 shrink-0', color)} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              {label}
            </span>
            <span
              className={cn(
                'font-display font-black text-2xl tracking-tighter leading-none',
                color
              )}
            >
              {value}
            </span>
            <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-wider">
              {sub}
            </span>
          </div>
        </Surface>
      ))}
    </div>
  );
}
