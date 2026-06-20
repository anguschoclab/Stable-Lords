import { Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { Trophy, Swords, Skull, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorldStatsProps {
  stableCount: number;
  warriorCount: number;
  killCount: number;
  topStable: string;
  topStableId: string | null;
} /**
 * World stats.
 * @param - { stable count, warrior count, kill count, top stable }.
 */

/**
 * World stats.
 * @param - { stable count, warrior count, kill count, top stable }.
 */
export function WorldStats({ stableCount, warriorCount, killCount, topStable, topStableId }: WorldStatsProps) {
  const stats = [
    {
      icon: Trophy,
      label: 'REGISTERED STABLES',
      value: stableCount,
      color: 'text-arena-gold',
      glow: 'shadow-arena-gold/20',
    },
    {
      icon: Swords,
      label: 'ACTIVE WARRIORS',
      value: warriorCount,
      color: 'text-primary',
      glow: 'shadow-primary/20',
    },
    {
      icon: Skull,
      label: 'TOTAL FATALITIES',
      value: killCount,
      color: 'text-destructive',
      glow: 'shadow-destructive/20',
    },
    {
      icon: Crown,
      label: 'DOMINANT STABLE',
      value: topStable,
      color: 'text-arena-gold',
      glow: 'shadow-arena-gold/20',
      smallValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((item, idx) => {
        const isDominant = item.label === 'DOMINANT STABLE';
        const inner = (
          <Surface
            key={idx}
            variant="glass"
            padding="none"
            className={cn(
              'group overflow-hidden border-white/5 transition-all',
              isDominant && topStableId
                ? 'hover:border-arena-gold/40 cursor-pointer'
                : 'hover:border-white/10'
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
              <item.icon className={cn('h-12 w-12', item.color)} />
            </div>
            <div className="p-5 flex flex-col justify-center min-h-[90px] relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1 leading-none">
                {item.label}
              </span>
              <p
                className={cn(
                  'font-display font-black truncate drop-shadow-md',
                  item.smallValue ? 'text-sm uppercase tracking-tight' : 'text-3xl tracking-tighter',
                  item.color
                )}
              >
                {item.value}
              </p>
            </div>
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full h-[2px] opacity-20 bg-gradient-to-r from-transparent via-current to-transparent',
                item.color
              )}
            />
          </Surface>
        );

        if (isDominant && topStableId) {
          return (
            <Link key={idx} to="/world/stable/$id" params={{ id: topStableId }}>
              {inner}
            </Link>
          );
        }
        return <div key={idx}>{inner}</div>;
      })}
    </div>
  );
}
