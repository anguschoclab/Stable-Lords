import { Surface } from '@/components/ui/Surface';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  { key: 'name', label: 'Combatant' },
  { key: 'stable', label: 'Patron Stable', className: 'hidden md:table-cell' },
  { key: 'style', label: 'Class', className: 'hidden lg:table-cell' },
  { key: 'compositeScore', label: 'Composite Pts', className: 'text-center' },
  { key: 'fame', label: 'Fame', className: 'text-center' },
  { key: 'wins', label: 'Wins', className: 'text-center' },
  { key: 'winRate', label: 'W%', className: 'text-center hidden sm:table-cell' },
  { key: 'kills', label: 'Kills', className: 'text-center' },
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
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
            {filtered.slice(0, 100).map((row, i) => (
              <WarriorLeaderboardRow key={row.id} row={row} index={i} isFiltered={isFiltered} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}
