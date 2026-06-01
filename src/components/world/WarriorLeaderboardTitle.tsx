import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WarriorLeaderboardTitleProps {
  isFiltered: boolean;
  filteredCount: number;
}

export function WarriorLeaderboardTitle({ isFiltered, filteredCount }: WarriorLeaderboardTitleProps) {
  return (
    <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-none bg-primary/20 border border-primary/30">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-display font-black uppercase tracking-tight">
            Vanguard Rankings
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            Elite Combatant Directory // Global Performance Index
          </p>
        </div>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] uppercase font-mono py-1 px-3 border-primary/20 text-primary"
      >
        {isFiltered ? `${filteredCount} Filtered` : 'Meritocracy Cycle Active'}
      </Badge>
    </div>
  );
}
