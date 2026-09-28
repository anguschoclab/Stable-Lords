import { Surface } from '@/components/ui/Surface';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="h-10 hover:bg-transparent border-white/5">
              <TableHead className="w-10 pl-6 text-[9px] font-black uppercase tracking-widest">#</TableHead>
              {head.map((h, i) => (
                <TableHead
                  key={h}
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest',
                    i === head.length - 1 && 'pr-6 text-right'
                  )}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.key}
                className={cn(
                  'h-11 border-white/5 transition-colors',
                  row.isPlayer ? 'bg-primary/[0.03] border-l-2 border-l-primary' : 'hover:bg-white/[0.02]'
                )}
              >
                <TableCell className="pl-6 font-mono text-[10px] font-black text-muted-foreground">
                  {String(row.rank).padStart(2, '0')}
                </TableCell>
                {row.cells.map((c, i) => (
                  <TableCell
                    key={i}
                    className={cn(i === row.cells.length - 1 && 'pr-6 text-right')}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Surface>
  );
}
