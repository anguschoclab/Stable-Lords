import { Trophy } from 'lucide-react';

export function StableRankingsTitle() {
  return (
    <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-none bg-primary/20 border border-primary/30">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-display font-black uppercase tracking-tight">
            Eminent Stables
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            League Table // National Commission Rankings
          </p>
        </div>
      </div>
    </div>
  );
}
