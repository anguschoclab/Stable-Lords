import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortHeader } from '@/components/ui/sort-header';

interface StableRankingsHeaderProps {
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

/**
 *
 */
export function StableRankingsHeader({ sort, onSort }: StableRankingsHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent border-white/5 bg-black/20">
        <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest opacity-40">
          #
        </TableHead>
        <TableHead>
          <SortHeader
            label="Stable"
            active={sort.field === 'name'}
            dir={sort.dir}
            onClick={() => onSort('name')}
          />
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <SortHeader
            label="Tier"
            active={sort.field === 'tier'}
            dir={sort.dir}
            onClick={() => onSort('tier')}
          />
        </TableHead>
        <TableHead className="text-right">
          <SortHeader
            label="Prestige"
            active={sort.field === 'fame'}
            dir={sort.dir}
            onClick={() => onSort('fame')}
          />
        </TableHead>
        <TableHead className="text-right">
          <SortHeader
            label="Victories"
            active={sort.field === 'wins'}
            dir={sort.dir}
            onClick={() => onSort('wins')}
          />
        </TableHead>
        <TableHead className="text-right">
          <SortHeader
            label="Losses"
            active={sort.field === 'losses'}
            dir={sort.dir}
            onClick={() => onSort('losses')}
          />
        </TableHead>
        <TableHead className="text-right hidden sm:table-cell">
          <SortHeader
            label="W%"
            active={sort.field === 'winRate'}
            dir={sort.dir}
            onClick={() => onSort('winRate')}
          />
        </TableHead>
        <TableHead className="text-right">
          <SortHeader
            label="Fatalities"
            active={sort.field === 'kills'}
            dir={sort.dir}
            onClick={() => onSort('kills')}
          />
        </TableHead>
        <TableHead className="w-10 text-center" />
      </TableRow>
    </TableHeader>
  );
}
