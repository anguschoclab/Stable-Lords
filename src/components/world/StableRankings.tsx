import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

const COLUMN_COUNT = 9;

/**
 * Stable standings table — virtualized like WarriorLeaderboard: bounded scroll
 * container, sticky header, spacer rows above/below the mounted window, and a
 * plain-map fallback when the virtualizer reports no items (jsdom, SSR).
 */
export function StableRankings({ rows, sort, onSort }: StableRankingsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual returns non-memoizable functions; no memo-safe alternative exists
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 46,
    overscan: 10,
    getScrollElement: () => scrollRef.current,
  });

  const items = virtualizer.getVirtualItems();
  const useFallback = items.length === 0 && rows.length > 0;

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <StableRankingsTitle />

      <div ref={scrollRef} className="max-h-[70vh] overflow-auto overflow-x-auto">
        <Table aria-rowcount={rows.length}>
          <StableRankingsHeader sort={sort} onSort={onSort} />
          <TableBody>
            {useFallback ? (
              rows.map((row, i) => <StableRankingsRow key={row.id} row={row} index={i} />)
            ) : (
              <>
                {items[0] && (
                  <tr style={{ height: items[0].start }}>
                    <td colSpan={COLUMN_COUNT} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
                {items.map((vi) => {
                  const row = rows[vi.index];
                  return row ? (
                    <StableRankingsRow key={vi.key} row={row} index={vi.index} />
                  ) : null;
                })}
                {items[items.length - 1] && (
                  <tr
                    style={{
                      height: virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0),
                    }}
                  >
                    <td colSpan={COLUMN_COUNT} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}
