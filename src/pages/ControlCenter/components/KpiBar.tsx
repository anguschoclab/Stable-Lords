import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Coins, Crown, Users, TrendingUp, Skull, Flame } from 'lucide-react';

export function KpiBar() {
  const { roster, treasury, fame, arenaHistory } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      treasury: s.treasury,
      fame: s.fame,
      arenaHistory: s.arenaHistory,
    }))
  );

  const stats = useMemo(() => calculateStableStats(roster), [roster]);
  const totalBouts = arenaHistory.length;
  const killRate = totalBouts > 0 ? Math.round((stats.totalKills / totalBouts) * 100) : 0;

  const kpis = [
    {
      label: 'Treasury',
      value: `${(treasury ?? 0).toLocaleString()}g`,
      icon: Coins,
      color: 'text-arena-gold',
      glow: 'shadow-[0_0_10px_rgba(212,175,55,0.2)]',
    },
    {
      label: 'Influence',
      value: String(fame),
      icon: Crown,
      color: 'text-arena-fame',
      glow: 'shadow-[0_0_10px_rgba(180,100,220,0.2)]',
    },
    {
      label: 'Roster',
      value: String(stats.activeCount),
      icon: Users,
      color: 'text-arena-pop',
      glow: '',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      glow: 'shadow-[0_0_10px_rgba(255,0,0,0.2)]',
    },
    {
      label: 'Total Kills',
      value: String(stats.totalKills),
      icon: Skull,
      color: 'text-destructive',
      glow: '',
    },
    { label: 'Kill Rate', value: `${killRate}%`, icon: Flame, color: 'text-arena-blood', glow: '' },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(({ label, value, icon: Icon, color, glow }) => (
        <Surface key={label} variant="glass" className={cn('p-4 flex flex-col gap-2', glow)}>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              {label}
            </span>
          </div>
          <span
            className={cn('font-display font-black text-2xl tracking-tighter leading-none', color)}
          >
            {value}
          </span>
        </Surface>
      ))}
    </div>
  );
}
