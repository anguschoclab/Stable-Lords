import { Surface } from '@/components/ui/Surface';
import { Trophy } from 'lucide-react';
import type { RivalPerformance } from '../hooks/useSeasonData';

interface DivisionalStandingsProps {
  rivals: RivalPerformance[];
}

export function DivisionalStandings({ rivals }: DivisionalStandingsProps) {
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
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-2 text-left font-black uppercase tracking-widest text-muted-foreground/60">Stable</th>
              <th className="px-4 py-2 text-left font-black uppercase tracking-widest text-muted-foreground/60">Doctrine</th>
              <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">W</th>
              <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">L</th>
              <th className="px-4 py-2 text-center font-black uppercase tracking-widest text-muted-foreground/60">K</th>
              <th className="px-4 py-2 text-right font-black uppercase tracking-widest text-muted-foreground/60">Win%</th>
            </tr>
          </thead>
          <tbody>
            {rivals.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i === 0 ? 'bg-arena-gold/[0.03]' : ''}`}
              >
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Trophy className="h-3 w-3 text-arena-gold shrink-0" />}
                    <span className="font-black text-foreground/80">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground/60 font-bold">{r.philosophy ?? '—'}</td>
                <td className="px-4 py-2.5 text-center font-mono font-black text-primary">{r.totalWins}</td>
                <td className="px-4 py-2.5 text-center font-mono font-black text-destructive/70">{r.totalLosses}</td>
                <td className="px-4 py-2.5 text-center font-mono font-black text-arena-blood">{r.totalKills}</td>
                <td className="px-4 py-2.5 text-right font-mono font-black">{Math.round(r.winRate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
