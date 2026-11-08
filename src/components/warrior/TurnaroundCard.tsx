import { Wrench } from 'lucide-react';
import type { Warrior } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { diagnoseTurnaround } from '@/engine/advisor/turnaroundAdvisor';
import type { TurnaroundAction, TurnaroundReport } from '@/engine/advisor/turnaroundAdvisor';

/**
 * Manager's notebook — the turnaround advisor's read on a losing warrior.
 * Renders nothing while the warrior is winning: the advice is for losers.
 */
export function TurnaroundCard({ warrior }: { warrior: Warrior }) {
  const report: TurnaroundReport | null = diagnoseTurnaround(warrior);
  if (!report) return null;

  return (
    <Surface variant="glass" className="border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
        <ImperialRing size="xs" variant="bronze">
          <Wrench className="h-3 w-3 text-arena-bronze" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
          Manager's Notebook
        </span>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <div className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
            Win Condition
          </div>
          <div className="text-sm font-display font-black uppercase">
            {report.winCondition.headline}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed">
            {report.winCondition.detail}
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
            Next Moves
          </div>
          {report.actions.map((a: TurnaroundAction) => (
            <div key={a.headline} className="space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {a.headline}
              </div>
              <p className="text-[11px] font-medium text-muted-foreground/70 leading-relaxed">
                {a.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
}
