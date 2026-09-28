import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap } from 'lucide-react';
import { MetaDriftWidget } from '@/components/widgets';
import type { RivalStableData } from '@/types/game';
import type { ArenaTitle } from '@/types/state.types';
import { RivalIntelligenceRow } from './RivalIntelligenceRow';

interface RivalIntelligenceProps {
  rivals: RivalStableData[];
  /** Arena title state — drives the per-rival title posture chip. */
  arenaChampions?: Record<string, ArenaTitle>;
}

function NetworkHeader({ count }: { count: number }) {
  return (
    <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-sm font-black uppercase tracking-tight">
            Rival Network
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            Rival Stables Overview
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
      >
        RIVALS: {count}
      </Badge>
    </div>
  );
}

function ScoutSummaryCard() {
  return (
    <Surface variant="glass" className="bg-primary/5 border-primary/20 border-dashed">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-none bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">
            Scout Summary
          </h5>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            Rival owners react to meta shifts with varying latency.{' '}
            <span className="text-foreground font-black">Innovators</span> anticipate trends,
            while <span className="text-foreground font-black">Traditionalists</span> provide
            predictable matchups. Study their patterns to exploit weaknesses in future bouts.
          </p>
        </div>
      </div>
    </Surface>
  );
}

/**
 * Rival intelligence.
 * @param - { rivals }.
 */
export function RivalIntelligence({ rivals, arenaChampions }: RivalIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <MetaDriftWidget />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
          <NetworkHeader count={rivals.length} />
          <div className="divide-y divide-white/5">
            {rivals.map((rival) => (
              <RivalIntelligenceRow
                key={rival.owner.id}
                rival={rival}
                arenaChampions={arenaChampions}
              />
            ))}
          </div>
        </Surface>
        <ScoutSummaryCard />
      </div>
    </div>
  );
}
