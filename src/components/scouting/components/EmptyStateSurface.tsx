import { Shield } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';

/**
 *
 */
export function EmptyStateSurface() {
  return (
    <Surface
      variant="glass"
      className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4"
    >
      <Shield className="h-12 w-12 text-muted-foreground opacity-20" />
      <div className="space-y-1">
        <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
          Select Rival Stables for Analysis
        </p>
        <p className="text-xs text-muted-foreground/60 italic">
          Choose two rival stables from the selector panels above to begin comparative analysis.
        </p>
      </div>
    </Surface>
  );
}
