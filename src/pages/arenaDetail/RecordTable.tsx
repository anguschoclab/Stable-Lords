import { Surface } from '@/components/ui/Surface';
import { StandingsTable, type StandingsColumn } from '@/components/ui/StandingsTable';
import { cn } from '@/lib/utils';

/** One ranked row on an arena record board. */
export interface RecordRow {
  key: string;
  rank: number;
  cells: React.ReactNode[];
  isPlayer: boolean;
}

/** A single arena record board: ranked rows under a titled header. */
export function RecordTable({
  title,
  icon,
  head,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  head: string[];
  rows: RecordRow[];
}) {
  const columns: StandingsColumn<RecordRow>[] = [
    {
      header: '#',
      headClassName: 'w-10 pl-6',
      cellClassName: 'pl-6 font-mono text-[10px] font-black text-muted-foreground',
      render: (row) => String(row.rank).padStart(2, '0'),
    },
    ...head.map(
      (h, i): StandingsColumn<RecordRow> => ({
        header: h,
        headClassName: cn(i === head.length - 1 && 'pr-6 text-right'),
        cellClassName: cn(i === head.length - 1 && 'pr-6 text-right'),
        render: (row) => row.cells[i],
      })
    ),
  ];
  return (
    <Surface variant="glass" className="overflow-hidden p-0">
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
          {title}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black py-8 text-center">
          No records yet
        </p>
      ) : (
        <StandingsTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.key}
          classes={{
            head: 'bg-white/[0.03]',
            headRow: 'h-10',
            headCell: 'text-[9px] font-black uppercase tracking-widest',
            row: (row) =>
              cn(
                'h-11 border-white/5 transition-colors motion-reduce:transition-none',
                row.isPlayer
                  ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                  : 'hover:bg-white/[0.02]'
              ),
          }}
        />
      )}
    </Surface>
  );
}
