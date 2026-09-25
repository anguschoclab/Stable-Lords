import { Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronRight, Swords, Heart, Trophy } from 'lucide-react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';

/**
 * Council briefing widget.
 */
export function CouncilBriefingWidget() {
  const { summary } = useStableAdvisor();

  return (
    <Surface
      variant="glass"
      className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ImperialRing size="xs" variant="gold">
              <ShieldCheck className="h-3.5 w-3.5 text-arena-gold" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-arena-gold">
              Lanista's War Council Directive
            </span>
          </div>

          <div className="space-y-1">
            {summary.stableDirectives.slice(0, 2).map((directive, i) => (
              <p key={i} className="text-xs font-semibold text-foreground/90 leading-snug">
                {directive}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-1 text-[9px] font-mono text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 text-primary" />
              {summary.combatReadyCount} Ready
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-destructive" />
              {summary.rehabCount} In Rehab
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-arena-gold" />
              {summary.tournamentContenderCount} Contenders
            </span>
          </div>
        </div>

        <Link to="/stable/advisor">
          <Button
            size="sm"
            className="h-10 px-5 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none border border-primary/40 transition-all shrink-0"
          >
            Review War Council
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Surface>
  );
}
