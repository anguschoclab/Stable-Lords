import { Surface } from '@/components/ui/Surface';
import { Table, TableBody } from '@/components/ui/table';
import { StableRankingsTitle } from './StableRankingsTitle';
import { StableRankingsHeader } from './StableRankingsHeader';
import { StableRankingsRow } from './StableRankingsRow';
import type { StableRow } from '@/types/leaderboard';

interface StableRankingsProps {
  rows: StableRow[];
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function StableRankings({ rows, sort, onSort }: StableRankingsProps) {
  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <StableRankingsTitle />

      <div className="overflow-x-auto">
        <Table>
          <StableRankingsHeader sort={sort} onSort={onSort} />
          <TableBody>
            {rows.map((row, i) => (
              <StableRankingsRow key={row.id} row={row} index={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}
