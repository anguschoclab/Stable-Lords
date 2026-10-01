import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Zap, Swords, AlertTriangle } from 'lucide-react';
import { FaceoffBar } from './FaceoffBar';

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

type FighterCalc = SimulatorResultsProps['simulation']['calcA'];

/** One fighter's post-sim stat column: HP / ENDUR / DMG / ENCUM. */
function FighterAnalysis({
  label,
  calc,
  tone,
}: {
  label: string;
  calc: FighterCalc;
  tone: 'primary' | 'destructive';
}) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary border-primary/20'
      : 'text-destructive border-destructive/20';
  const cells: Array<[string, number]> = [
    ['HP', calc.hp],
    ['ENDUR', calc.endurance],
    ['DMG', calc.damage],
    ['ENCUM', calc.encumbrance],
  ];
  return (
    <div className="space-y-4">
      <h4 className={`text-[10px] font-black uppercase tracking-widest ${toneClass} border-b pb-2`}>
        {label} Analysis
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([stat, value]) => (
          <div key={stat} className="bg-black/20 p-3 border border-white/5">
            <div className="text-muted-foreground text-[8px] uppercase font-black">{stat}</div>
            <div className="font-mono font-black text-lg">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Elapsed-time center column with early-stoppage badge. */
function ElapsedColumn({ minutesPassed }: { minutesPassed: number }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <Swords className="h-10 w-10 text-muted-foreground/20" />
      <div className="text-center">
        <span className="text-2xl font-display font-black text-foreground">{minutesPassed}M</span>
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
          ELAPSED TIME
        </p>
      </div>
      {minutesPassed < 10 && (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[9px] font-black uppercase h-6 px-3">
          <AlertTriangle className="h-3 w-3 mr-1.5" /> Early_Stoppage
        </Badge>
      )}
    </div>
  );
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
          SIMULATION RESULTS (10 MINUTE BOUT)
        </span>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FighterAnalysis label="Fighter A" calc={simulation.calcA} tone="primary" />
          <ElapsedColumn minutesPassed={simulation.minutesPassed} />
          <FighterAnalysis label="Fighter B" calc={simulation.calcB} tone="destructive" />
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Ending HP — Face-off
            </span>
          </div>
          <FaceoffBar
            fighterA={{ hp: simulation.hpA, max: simulation.calcA.hp, label: 'Fighter A' }}
            fighterB={{ hp: simulation.hpB, max: simulation.calcB.hp, label: 'Fighter B' }}
          />
        </div>
      </div>
    </Surface>
  );
}
