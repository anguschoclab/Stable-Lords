import { BarChart3 } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { ComparisonBar } from '../ComparisonBar';
import { ATTRIBUTE_KEYS } from '@/types/game';
import type { StableStats } from '@/engine/stats/stableStats';

interface AverageAttributesSectionProps {
  statsA: StableStats;
  statsB: StableStats;
  maxAttr: number;
}

/**
 *
 */
export function AverageAttributesSection({
  statsA,
  statsB,
  maxAttr,
}: AverageAttributesSectionProps) {
  return (
    <Surface variant="glass" className="border-border/40 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-accent/10 border border-accent/20">
          <BarChart3 className="h-3.5 w-3.5 text-accent" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          Average Attributes
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {ATTRIBUTE_KEYS.map((key) => (
          <ComparisonBar
            key={key}
            label={key}
            valA={statsA.avgAttributes[key] ?? 0}
            valB={statsB.avgAttributes[key] ?? 0}
            maxVal={maxAttr}
            colorA="bg-primary"
            colorB="bg-accent"
          />
        ))}
      </div>
    </Surface>
  );
}
