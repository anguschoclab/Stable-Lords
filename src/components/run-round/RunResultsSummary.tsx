import { Skull, Activity } from 'lucide-react';

interface RunResultsSummaryProps {
  deaths: number;
  KOs: number;
}

/**
 *
 */
export function RunResultsSummary({ deaths, KOs }: RunResultsSummaryProps) {
  return (
    <div className="flex items-center gap-3 px-2">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
        Post Engagement Analysis
      </h3>
      <div className="h-px flex-1 bg-border/20" />
      <div className="flex gap-4">
        {deaths > 0 && (
          <span className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-1.5">
            <Skull className="h-3 w-3" /> {deaths} Casualties
          </span>
        )}
        {KOs > 0 && (
          <span className="text-[10px] font-black text-arena-gold uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> {KOs} KOs
          </span>
        )}
      </div>
    </div>
  );
}
