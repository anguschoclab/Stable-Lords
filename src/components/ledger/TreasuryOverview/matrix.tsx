import { Surface } from '@/components/ui/Surface';
import { TrendingUp, Skull, Swords, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Global treasury matrix props.
 */
export interface GlobalTreasuryMatrixProps {
  gold: number;
  activeWarriorsCount: number;
  totalWins: number;
  totalKills: number;
}

/**
 * Global treasury matrix.
 */
export function GlobalTreasuryMatrix({
  gold,
  activeWarriorsCount,
  totalWins,
  totalKills,
}: GlobalTreasuryMatrixProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          label: 'Treasury Reserve',
          value: `${gold.toLocaleString()}G`,
          icon: Wallet,
          color: 'text-arena-gold',
          variant: 'gold' as const,
          desc: 'Liquid capital available for operations and recruitment.',
        },
        {
          label: 'Warriors',
          value: activeWarriorsCount,
          icon: Swords,
          color: 'text-primary',
          variant: 'glass' as const,
          desc: 'Total warriors currently on your roster.',
        },
        {
          label: 'Total Wins',
          value: totalWins,
          icon: TrendingUp,
          color: 'text-arena-pop',
          variant: 'glass' as const,
          desc: 'Cumulative competitive victories across all career rosters.',
        },
        {
          label: 'Arena Kills',
          value: totalKills,
          icon: Skull,
          color: 'text-destructive',
          variant: 'blood' as const,
          desc: 'Final cessation incidents recorded during arena engagements.',
        },
      ].map((stat) => (
        <Tooltip key={stat.label}>
          <TooltipTrigger asChild>
            <Surface
              variant={stat.variant}
              padding="md"
              className="flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all motion-reduce:transition-none motion-reduce:transform-none relative overflow-hidden h-32"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity motion-reduce:transition-none">
                <stat.icon className="h-10 w-10" />
              </div>
              <stat.icon
                className={cn(
                  'h-5 w-5 mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-300',
                  stat.color
                )}
              />
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-1 opacity-60">
                {stat.label}
              </span>
              <span
                className={cn(
                  'text-3xl font-display font-black leading-none drop-shadow-sm',
                  stat.color
                )}
              >
                {stat.value}
              </span>
            </Surface>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-950 border-white/10 text-[10px] uppercase font-black tracking-widest px-4 py-2">
            {stat.desc}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
