import { Link } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { displayWeek } from '@/engine/core/absoluteWeek';
import type { ArenaTitle } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { StandingsTable, type StandingsColumn } from '@/components/ui/StandingsTable';

const END_REASON_LABEL: Record<string, string> = {
  died: 'Died in the arena',
  defeated: 'Defeated for the crown',
  retired: 'Retired',
  stripped: 'Stripped for refusing to defend',
  relinquished: 'Relinquished the crown',
  displaced: 'Stable folded — champion displaced',
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

type TitleReignRow = ArenaTitle['history'][number];

const TITLE_HISTORY_COLUMNS: StandingsColumn<TitleReignRow>[] = [
  {
    header: 'CHAMPION',
    headClassName: 'pl-6',
    cellClassName: 'pl-6',
    render: (r) => (
      <WarriorNameTag id={r.warriorId} name={r.warriorName} epithet={r.warriorEpithet} />
    ),
  },
  {
    header: 'STABLE',
    cellClassName:
      'text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic',
    render: (r) => r.stableName ?? '—',
  },
  {
    header: 'REIGN',
    headClassName: 'text-center',
    cellClassName: 'text-center font-mono text-[10px] text-muted-foreground/60',
    render: (r) => (
      <>
        wk {displayWeek(r.startedAbsoluteWeek)} → wk {displayWeek(r.endedAbsoluteWeek)}
      </>
    ),
  },
  {
    header: 'DEF',
    headClassName: 'text-center',
    cellClassName: 'text-center font-mono text-[10px] font-black text-arena-gold',
    render: (r) => r.defenses,
  },
  {
    header: 'ENDED',
    headClassName: 'pr-6 text-right',
    cellClassName:
      'pr-6 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/60',
    render: (r) => END_REASON_LABEL[r.endReason] ?? r.endReason,
  },
];

/** Title history table — past reigns, defenses, and how each ended. */
export function TitleHistory({ history }: { history: ArenaTitle['history'] }) {
  if (history.length === 0) return null;
  return (
    <>
      <SectionDivider label="Title History" variant="gold" />
      <Surface variant="glass" className="overflow-hidden p-0">
        <StandingsTable
          columns={TITLE_HISTORY_COLUMNS}
          rows={history}
          rowKey={(r, i) => `${r.warriorId}-${r.startedAbsoluteWeek}-${i}`}
          classes={{
            head: 'bg-white/[0.03]',
            headRow: 'h-10',
            headCell: 'text-[9px] font-black uppercase tracking-widest',
            row: 'h-11 border-white/5',
          }}
        />
      </Surface>
    </>
  );
}

/** Recent-bouts strip — the last eight fights at this venue. */
export function RecentBouts({ bouts, arenaId }: { bouts: FightSummary[]; arenaId: string }) {
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
