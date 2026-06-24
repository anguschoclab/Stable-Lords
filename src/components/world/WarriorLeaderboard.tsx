import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Surface } from '@/components/ui/Surface';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortHeader } from '@/components/ui/sort-header';
import { useWarriorLeaderboard } from '@/hooks/useWarriorLeaderboard';
import { WarriorLeaderboardFilters } from './WarriorLeaderboardFilters';
import { WarriorLeaderboardTitle } from './WarriorLeaderboardTitle';
import { WarriorLeaderboardRow } from './WarriorLeaderboardRow';
import type { WarriorRow } from '@/types/leaderboard';

interface WarriorLeaderboardProps {
  rows: WarriorRow[];
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

const COLUMNS = [
  { key: 'officialRank', label: 'Rank', className: 'w-16 text-center' },
  { key: 'name', label: 'Warrior' },
  { key: 'stable', label: 'Patron Stable', className: 'hidden md:table-cell' },
  { key: 'style', label: 'Class', className: 'hidden lg:table-cell' },
  { key: 'compositeScore', label: 'Composite Pts', className: 'text-center' },
  { key: 'fame', label: 'Fame', className: 'text-center' },
  { key: 'wins', label: 'Wins', className: 'text-center' },
  { key: 'winRate', label: 'W%', className: 'text-center hidden sm:table-cell' },
  { key: 'kills', label: 'Kills', className: 'text-center' },
  { key: 'bookmark', label: '', className: 'w-10 text-center' },
];

export function WarriorLeaderboard({ rows, sort, onSort }: WarriorLeaderboardProps) {
  const {
    classes,
    classFilter,
    setClassFilter,
    quickFilter,
    setQuickFilter,
    myWarriorsOnly,
    setMyWarriorsOnly,
    filtered,
    isFiltered,
    clearFilters,
  } = useWarriorLeaderboard(rows);

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    estimateSize: () => 48,
    overscan: 10,
    getScrollElement: () => scrollRef.current,
  });

  const items = virtualizer.getVirtualItems();
  const useFallback = items.length === 0 && filtered.length > 0;

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <WarriorLeaderboardTitle isFiltered={isFiltered} filteredCount={filtered.length} />

      <WarriorLeaderboardFilters
        classes={classes}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        myWarriorsOnly={myWarriorsOnly}
        setMyWarriorsOnly={setMyWarriorsOnly}
        onSort={onSort}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
      />

      <div ref={scrollRef} className="max-h-[70vh] overflow-auto overflow-x-auto">
        <table className="w-full caption-bottom text-sm" aria-rowcount={filtered.length}>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent border-white/5 bg-black/20">
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  <SortHeader
                    label={col.label}
                    active={sort.field === col.key}
                    dir={sort.dir}
                    onClick={() => onSort(col.key)}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {useFallback ? (
              filtered.map((row, i) => (
                <WarriorLeaderboardRow key={row.id} row={row} index={i} isFiltered={isFiltered} />
              ))
            ) : (
              <>
                {items[0] && (
                  <tr style={{ height: items[0].start }}>
                    <td colSpan={COLUMNS.length} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
                {items.map((vi) => (
                  <WarriorLeaderboardRow
                    key={filtered[vi.index]!.id}
                    row={filtered[vi.index]!}
                    index={vi.index}
                    isFiltered={isFiltered}
                  />
                ))}
                {items[items.length - 1] && (
                  <tr
                    style={{
                      height:
                        virtualizer.getTotalSize() - items[items.length - 1]!.end,
                    }}
                  >
                    <td colSpan={COLUMNS.length} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </table>
      </div>
    </Surface>
  );
}
