import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { ShieldCheck, Swords, Heart, Trophy, Dumbbell, Sparkles } from 'lucide-react';
import type { StableAdvisorSummary } from '@/engine/advisor/types';

interface CouncilHeaderProps {
  summary: StableAdvisorSummary;
  onExecuteAll: () => void;
}

/** War Council banner: stable-wide directives, purse/solvency projection, KPI bar, and the Execute-All action. */
export function CouncilHeader({ summary, onExecuteAll }: CouncilHeaderProps) {
  const hasActionable = summary.allActionPayloads.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Directive & Master Action Banner */}
      <Surface variant="glass" className="p-8 border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ImperialRing size="sm" variant="gold">
                <ShieldCheck className="h-4 w-4 text-arena-gold" />
              </ImperialRing>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-arena-gold">
                War Council Strategic Directive
              </span>
            </div>
            <div className="space-y-1.5 pl-1">
              {summary.stableDirectives.map((directive, i) => (
                <p key={i} className="text-xs font-semibold text-foreground/90 leading-relaxed flex items-center gap-2">
                  <span>{directive}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex flex-col items-end px-4 border-l border-white/10 hidden sm:flex">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                Purse Projection
              </span>
              <span className="font-display font-black text-sm text-arena-gold">
                +{summary.projectedPurseGold}G
              </span>
              <span className="text-[8px] text-muted-foreground/40 font-mono">
                Training: -{summary.projectedTrainingCost}G · Treasury: {summary.treasury}G
              </span>
              {summary.solvencyWarning && (
                <span
                  data-testid="solvency-warning"
                  className="mt-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-destructive/20 text-destructive border border-destructive/40"
                >
                  Insolvent
                </span>
              )}
            </div>

            <Button
              size="lg"
              disabled={!hasActionable}
              onClick={onExecuteAll}
              className="h-12 px-8 font-black uppercase text-[11px] tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-none border border-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              Execute War Council Plan
            </Button>
          </div>
        </div>
      </Surface>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Surface variant="glass" className="p-4 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Combat Ready</span>
              <span className="text-base font-display font-black text-foreground">{summary.combatReadyCount}</span>
            </div>
          </div>
        </Surface>

        <Surface variant="glass" className="p-4 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-destructive" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Med Bay Rehab</span>
              <span className="text-base font-display font-black text-foreground">{summary.rehabCount}</span>
            </div>
          </div>
        </Surface>

        <Surface variant="glass" className="p-4 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-4 w-4 text-arena-gold" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Contenders</span>
              <span className="text-base font-display font-black text-foreground">{summary.tournamentContenderCount}</span>
            </div>
          </div>
        </Surface>

        <Surface variant="glass" className="p-4 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-4 w-4 text-arena-pop" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Unassigned Drills</span>
              <span className="text-base font-display font-black text-foreground">{summary.unassignedTrainingCount}</span>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
