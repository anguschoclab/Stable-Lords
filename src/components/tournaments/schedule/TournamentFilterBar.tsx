import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export type FilterStatus = 'all' | 'upcoming' | 'completed' | 'current-round';

interface TournamentFilterBarProps {
  filter: FilterStatus;
  setFilter: (f: FilterStatus) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export function TournamentFilterBar({
  filter,
  setFilter,
  expandAll,
  collapseAll,
}: TournamentFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-bold uppercase">Filter:</span>
      </div>
      {(['all', 'upcoming', 'completed', 'current-round'] as FilterStatus[]).map((f) => (
        <Button
          key={f}
          variant={filter === f ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(f)}
          className="text-[10px] uppercase font-bold h-7"
        >
          {f === 'current-round' ? 'Current Round' : f}
        </Button>
      ))}
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={expandAll} className="text-[10px] uppercase h-7">
        Expand All
      </Button>
      <Button variant="ghost" size="sm" onClick={collapseAll} className="text-[10px] uppercase h-7">
        Collapse
      </Button>
    </div>
  );
}
