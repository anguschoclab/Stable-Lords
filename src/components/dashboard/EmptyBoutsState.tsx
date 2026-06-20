import { TableRow, TableCell } from '@/components/ui/table';

/**
 *
 */
export function EmptyBoutsState() {
  return (
    <TableRow className="hover:bg-transparent border-none">
      <TableCell colSpan={4} className="py-12 text-center opacity-20 italic">
        <p className="text-[10px] uppercase tracking-[0.3em]">No bout data yet</p>
      </TableCell>
    </TableRow>
  );
}
