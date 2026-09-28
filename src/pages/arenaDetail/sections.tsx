import { Link } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { displayWeek } from '@/engine/core/absoluteWeek';
import type { ArenaTitle } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const END_REASON_LABEL: Record<string, string> = {
  died: 'Died in the arena',
  defeated: 'Defeated for the crown',
  retired: 'Retired',
  stripped: 'Stripped for refusing to defend',
  relinquished: 'Relinquished the crown',
};

/** Unknown-venue empty state for a bad arenaId param. */
export function UnknownArena() {
  return (
    <Surface variant="glass" className="p-10 text-center">
      <MapPin className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        This arena does not exist in the circuit
      </p>
      <Link
        to="/world/arenas"
        className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
      >
        Back to the Arena Circuit
      </Link>
    </Surface>
  );
}

/** Title history table — past reigns, defenses, and how each ended. */
export function TitleHistory({ history }: { history: ArenaTitle['history'] }) {
  if (history.length === 0) return null;
  return (
    <>
      <SectionDivider label="Title History" variant="gold" />
      <Surface variant="glass" className="overflow-hidden p-0">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="h-10 hover:bg-transparent border-white/5">
              <TableHead className="pl-6 text-[9px] font-black uppercase tracking-widest">CHAMPION</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest">STABLE</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">REIGN</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">DEF</TableHead>
              <TableHead className="pr-6 text-right text-[9px] font-black uppercase tracking-widest">ENDED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((r, i) => (
              <TableRow key={`${r.warriorId}-${r.startedAbsoluteWeek}-${i}`} className="h-11 border-white/5">
                <TableCell className="pl-6">
                  <WarriorNameTag id={r.warriorId} name={r.warriorName} />
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
                  {r.stableName ?? '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-[10px] text-muted-foreground/60">
                  wk {displayWeek(r.startedAbsoluteWeek)} → wk {displayWeek(r.endedAbsoluteWeek)}
                </TableCell>
                <TableCell className="text-center font-mono text-[10px] font-black text-arena-gold">
                  {r.defenses}
                </TableCell>
                <TableCell className="pr-6 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {END_REASON_LABEL[r.endReason] ?? r.endReason}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Surface>
    </>
  );
}

/** Recent-bouts strip — the last eight fights at this venue. */
export function RecentBouts({
  bouts,
  arenaId,
}: {
  bouts: FightSummary[];
  arenaId: string;
}) {
  if (bouts.length === 0) return null;
  return (
    <>
      <SectionDivider label="Recent Bouts" variant="primary" />
      <Surface variant="glass" className="p-0">
        <div className="divide-y divide-white/5">
          {bouts.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-6 py-3 text-[10px]">
              <span className="text-foreground/80 flex items-center gap-2">
                {f.title}
                {f.titleArenaId === arenaId && (
                  <Badge
                    variant="outline"
                    className="text-[7px] font-black tracking-widest border-arena-gold/40 text-arena-gold"
                  >
                    TITLE
                  </Badge>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-black uppercase tracking-widest text-muted-foreground/50">
                  {f.by}
                </span>
                <span className="font-mono text-muted-foreground/40">Wk {f.week}</span>
              </span>
            </div>
          ))}
        </div>
      </Surface>
    </>
  );
}
