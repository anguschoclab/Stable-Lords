/**
 * Shared standings/record-table primitive — column-driven header band and row
 * mapping over the ui/table primitives, so every leaderboard/registry surface
 * renders the same skeleton with per-site styling hooks.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** A column of a {@link StandingsTable} — header label plus a per-row cell renderer. */
export interface StandingsColumn<Row> {
  /** Header label or node. */
  header: ReactNode;
  /** Extra classes merged onto this column's <TableHead>. */
  headClassName?: string;
  /** Render the cell content for `row`. */
  render: (row: Row, index: number) => ReactNode;
  /** Extra classes merged onto each of this column's <TableCell>s — static or per-row. */
  cellClassName?: string | ((row: Row, index: number) => string | undefined);
}

/** Style slots for a {@link StandingsTable} — each maps to one element of the skeleton. */
interface StandingsTableClasses<Row = unknown> {
  /** Classes for the <Table> element. */
  root?: string;
  /** Classes for the <TableHeader> band. */
  head?: string;
  /** Classes for the header <TableRow> (merged over the no-hover + faint-rule default). */
  headRow?: string;
  /** Shared typography merged onto every header cell (defaults to the caps ledger style). */
  headCell?: string;
  /** Static or per-row classes for body <TableRow>s. */
  row?: string | ((row: Row, index: number) => string | undefined);
}

/** Props for {@link StandingsTable}. */
interface StandingsTableProps<Row> {
  columns: StandingsColumn<Row>[];
  rows: Row[];
  /** Key extractor for body rows. */
  rowKey: (row: Row, index: number) => string | number;
  classes?: StandingsTableClasses<Row>;
}

const DEFAULT_HEAD_CELL = 'font-black uppercase text-[10px] tracking-widest';

/**
 * Renders `rows` as a standings/record table: a `columns`-driven header row
 * followed by one `<TableRow>` per row with a `<TableCell>` per column.
 */
export function StandingsTable<Row>({
  columns,
  rows,
  rowKey,
  classes,
}: StandingsTableProps<Row>) {
  const rowClass = classes?.row;
  return (
    <Table className={classes?.root}>
      <TableHeader className={classes?.head}>
        <TableRow className={cn('hover:bg-transparent border-white/5', classes?.headRow)}>
          {columns.map((col, i) => (
            <TableHead
              key={i}
              className={cn(classes?.headCell ?? DEFAULT_HEAD_CELL, col.headClassName)}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow
            key={rowKey(row, i)}
            className={typeof rowClass === 'function' ? rowClass(row, i) : rowClass}
          >
            {columns.map((col, j) => (
              <TableCell
                key={j}
                className={
                  typeof col.cellClassName === 'function'
                    ? col.cellClassName(row, i)
                    : col.cellClassName
                }
              >
                {col.render(row, i)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
