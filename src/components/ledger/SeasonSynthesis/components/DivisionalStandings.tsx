import { Surface } from '@/components/ui/Surface';
import { Trophy } from 'lucide-react';
import type { RivalPerformance } from '../hooks/useSeasonData';
import { ListToolbar } from '@/components/scouting/rivalListShell';
import { useListShell } from '@/hooks/useListShell';
import type { SortOption } from '@/hooks/useListShell';

interface DivisionalStandingsProps {
  rivals: RivalPerformance[];
}

const STANDING_SORTS: SortOption<RivalPerformance>[] = [
  { id: 'winRate', label: 'Win%', compare: (a, b) => b.winRate - a.winRate },
  { id: 'wins', label: 'Wins', compare: (a, b) => b.totalWins - a.totalWins },
  { id: 'kills', label: 'Kills', compare: (a, b) => b.totalKills - a.totalKills },
  { id: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
];

const HEAD_CELL = 'px-4 py-2 font-black uppercase tracking-widest text-muted-foreground/60';

/** Standings table body — one row per rival performance. */
function StandingsTable({ rows }: { rows: RivalPerformance[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className={`px-5 ${HEAD_CELL} text-left`}>Stable</th>
            <th className={`${HEAD_CELL} text-left`}>Doctrine</th>
            <th className={`${HEAD_CELL} text-center`}>W</th>
            <th className={`${HEAD_CELL} text-center`}>L</th>
            <th className={`${HEAD_CELL} text-center`}>K</th>
            <th className={`${HEAD_CELL} text-right`}>Win%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i === 0 ? 'bg-arena-gold/[0.03]' : ''} motion-reduce:transition-none`}
            >
              <td className="px-5 py-2.5">
                <div className="flex items-center gap-2">
                  {i === 0 && <Trophy className="h-3 w-3 text-arena-gold shrink-0" />}
                  <span className="font-black text-foreground/80">{r.name}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground/60 font-bold">
                {r.philosophy ?? '—'}
              </td>
              <td className="px-4 py-2.5 text-center font-mono font-black text-primary">
                {r.totalWins}
              </td>
              <td className="px-4 py-2.5 text-center font-mono font-black text-destructive/70">
                {r.totalLosses}
              </td>
              <td className="px-4 py-2.5 text-center font-mono font-black text-arena-blood">
                {r.totalKills}
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-black">
                {Math.round(r.winRate * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 *
 */
export function DivisionalStandings({ rivals }: DivisionalStandingsProps) {
  const list = useListShell(rivals, {
    searchText: (r) => [r.name, r.philosophy ?? ''],
    sorts: STANDING_SORTS,
    pageSize: 25,
  });

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
          <Trophy className="h-3.5 w-3.5 text-arena-gold" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          Divisional Standings
        </h3>
      </div>
      <div className="py-3 border-b border-white/5">
        <ListToolbar
          list={list}
          sorts={STANDING_SORTS}
          placeholder="Search stables…"
          ariaLabel="Filter standings"
        />
      </div>
      <StandingsTable rows={list.visible} />
    </Surface>
  );
}
