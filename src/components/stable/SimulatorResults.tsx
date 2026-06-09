import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Zap, Swords, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulatorResultsProps {
  simulation: {
    calcA: {
      hp: number;
      endurance: number;
      damage: number;
      encumbrance: number;
    };
    calcB: {
      hp: number;
      endurance: number;
      damage: number;
      encumbrance: number;
    };
    endA: number;
    endB: number;
    hpA: number;
    hpB: number;
    minutesPassed: number;
  };
}

/**
 *
 */
export function SimulatorResults({ simulation }: SimulatorResultsProps) {
  return (
    <Surface variant="glass" className="border-accent/40 bg-accent/5 p-0 overflow-hidden">
      <div className="bg-accent/10 px-6 py-4 border-b border-accent/20 flex items-center gap-2">
        <Zap className="h-4 w-4 text-accent" />
        <span className="text-[10px] font-black uppercase tracking-widest text-accent">
          SIMULATION RESULTS (10 MINUTES ENGAGEMENT)
        </span>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
              Fighter A Analysis
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">HP</div>
                <div className="font-mono font-black text-lg">{simulation.calcA.hp}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">ENDUR</div>
                <div className="font-mono font-black text-lg">{simulation.calcA.endurance}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">DMG</div>
                <div className="font-mono font-black text-lg">{simulation.calcA.damage}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">ENCUM</div>
                <div className="font-mono font-black text-lg">{simulation.calcA.encumbrance}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6">
            <Swords className="h-10 w-10 text-muted-foreground/20" />
            <div className="text-center">
              <span className="text-2xl font-display font-black text-foreground">
                {simulation.minutesPassed}M
              </span>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
                ELAPSED TIME
              </p>
            </div>
            {simulation.minutesPassed < 10 && (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[9px] font-black uppercase h-6 px-3">
                <AlertTriangle className="h-3 w-3 mr-1.5" /> Early_Stoppage
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive border-b border-destructive/20 pb-2">
              Fighter B Analysis
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">HP</div>
                <div className="font-mono font-black text-lg">{simulation.calcB.hp}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">ENDUR</div>
                <div className="font-mono font-black text-lg">{simulation.calcB.endurance}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">DMG</div>
                <div className="font-mono font-black text-lg">{simulation.calcB.damage}</div>
              </div>
              <div className="bg-black/20 p-3 border border-white/5">
                <div className="text-muted-foreground text-[8px] uppercase font-black">ENCUM</div>
                <div className="font-mono font-black text-lg">{simulation.calcB.encumbrance}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Ending HP
              </span>
              <span
                className={cn(
                  'font-display font-black text-xl',
                  simulation.hpA <= 0 ? 'text-destructive' : 'text-primary'
                )}
              >
                {simulation.hpA}/{simulation.calcA.hp}
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-none overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${Math.max(0, (simulation.hpA / simulation.calcA.hp) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Ending HP
              </span>
              <span
                className={cn(
                  'font-display font-black text-xl',
                  simulation.hpB <= 0 ? 'text-destructive' : 'text-primary'
                )}
              >
                {simulation.hpB}/{simulation.calcB.hp}
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-none overflow-hidden">
              <div
                className="h-full bg-destructive"
                style={{
                  width: `${Math.max(0, (simulation.hpB / simulation.calcB.hp) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
