import { Trophy, Swords, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData } from '@/types/game';
import type { StableStats } from '@/engine/stats/stableStats';

interface KeyMetricsSectionProps {
  rivalA: RivalStableData;
  rivalB: RivalStableData;
  statsA: StableStats;
  statsB: StableStats;
  maxWins: number;
  maxKills: number;
  maxFame: number;
  maxActive: number;
}

/**
 *
 */
export function KeyMetricsSection({
  rivalA,
  rivalB,
  statsA,
  statsB,
  maxWins,
  maxKills,
  maxFame,
  maxActive,
}: KeyMetricsSectionProps) {
  return (
    <Surface variant="glass" className="border-border/40 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-primary/10 border border-primary/20">
          <Trophy className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          Key Metrics
        </h3>
      </div>

      <div className="p-6 grid grid-cols-2 gap-8">
        {[
          {
            rival: rivalA,
            stats: statsA,
            color: 'text-primary',
          },
          {
            rival: rivalB,
            stats: statsB,
            color: 'text-accent',
          },
        ].map(({ rival, stats, color }) => (
          <div key={rival.owner.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {rival.owner.stableName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                icon={<Trophy className="h-4 w-4" />}
                label="Total Wins"
                value={stats.totalWins}
                maxValue={maxWins}
                color={color}
              />
              <MetricCard
                icon={<Swords className="h-4 w-4" />}
                label="Total Kills"
                value={stats.totalKills}
                maxValue={maxKills}
                color={color}
              />
              <MetricCard
                icon={<Star className="h-4 w-4" />}
                label="Total Fame"
                value={stats.totalFame}
                maxValue={maxFame}
                color={color}
              />
              <MetricCard
                icon={<Users className="h-4 w-4" />}
                label="Active Warriors"
                value={stats.activeCount}
                maxValue={maxActive}
                color={color}
              />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function MetricCard({ icon, label, value, maxValue, color }: MetricCardProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="relative">
        <div className="h-8 bg-neutral-900 rounded-none border border-white/5 overflow-hidden">
          <div
            className={cn('h-full transition-all motion-reduce:transition-none motion-reduce:transform-none', color.replace('text-', 'bg-'))}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
