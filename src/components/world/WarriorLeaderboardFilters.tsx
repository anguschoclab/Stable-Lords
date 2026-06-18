import { type ReactNode } from 'react';
import { Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVE_CLASSES = 'bg-primary/20 text-primary border-primary/40';
const INACTIVE_CLASSES =
  'bg-white/5 text-muted-foreground/50 border-white/10 hover:text-foreground hover:border-white/20';

interface FilterToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
  ariaLabel: string;
}

function FilterToggleButton({ active, onClick, label, ariaLabel }: FilterToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        active ? ACTIVE_CLASSES : INACTIVE_CLASSES
      )}
    >
      {label}
    </button>
  );
}

interface WarriorLeaderboardFiltersProps {
  classes: string[];
  classFilter: string | null;
  setClassFilter: (v: string | null) => void;
  quickFilter: 'kills' | 'wins' | 'winRate' | null;
  setQuickFilter: (v: 'kills' | 'wins' | 'winRate' | null) => void;
  myWarriorsOnly: boolean;
  setMyWarriorsOnly: (v: boolean | ((prev: boolean) => boolean)) => void;
  onSort: (field: string) => void;
  isFiltered: boolean;
  clearFilters: () => void;
}

/**
 *
 */
export function WarriorLeaderboardFilters({
  classes,
  classFilter,
  setClassFilter,
  quickFilter,
  setQuickFilter,
  myWarriorsOnly,
  setMyWarriorsOnly,
  onSort,
  isFiltered,
  clearFilters,
}: WarriorLeaderboardFiltersProps) {
  return (
    <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex flex-wrap items-center gap-2">
      <FilterToggleButton
        active={myWarriorsOnly}
        onClick={() => setMyWarriorsOnly((v) => !v)}
        ariaLabel="Toggle My Warriors"
        label={
          <>
            <Crown className="h-3 w-3" /> My Warriors
          </>
        }
      />

      <div className="w-px h-4 bg-white/10 mx-1" />

      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">
        Class
      </span>
      {classes.map((cls) => (
        <FilterToggleButton
          key={cls}
          active={classFilter === cls}
          onClick={() => setClassFilter(classFilter === cls ? null : cls)}
          ariaLabel={`Filter by ${cls}`}
          label={cls}
        />
      ))}

      <div className="w-px h-4 bg-white/10 mx-1" />

      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">
        Sort by
      </span>
      {(['kills', 'wins', 'winRate'] as const).map((f) => (
        <FilterToggleButton
          key={f}
          active={quickFilter === f}
          onClick={() => {
            setQuickFilter(quickFilter === f ? null : f);
            if (quickFilter !== f) onSort(f);
          }}
          ariaLabel={`Sort by ${f}`}
          label={f === 'winRate' ? 'W%' : f === 'kills' ? 'Kills' : 'Wins'}
        />
      ))}

      {isFiltered && (
        <button
          onClick={clearFilters}
          aria-label="Clear filters"
          className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}
