import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';

interface CombatAnalysisProps {
  suspectedOE?: number | string;
  suspectedAL?: number | string;
  knownInjuries: string[];
}

/**
 *
 */
export function CombatAnalysis({ suspectedOE, suspectedAL, knownInjuries }: CombatAnalysisProps) {
  const hasCombatData = suspectedOE || knownInjuries.length > 0;

  if (!hasCombatData) return null;

  return (
    <Surface variant="glass" className="bg-black/40 border-border/20 p-6 space-y-6">
      {suspectedOE && <SuspectedModifiers suspectedOE={suspectedOE} suspectedAL={suspectedAL} />}

      {knownInjuries.length > 0 && <InjuryList injuries={knownInjuries} />}
    </Surface>
  );
}

interface SuspectedModifiersProps {
  suspectedOE?: number | string;
  suspectedAL?: number | string;
}

function SuspectedModifiers({ suspectedOE, suspectedAL }: SuspectedModifiersProps) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-destructive/40">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
            Suspected OE
          </span>
        </div>
        <span className="text-xl font-mono font-black text-destructive/80 ml-5 block leading-none">
          {typeof suspectedOE === 'string' ? suspectedOE : suspectedOE}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary/40">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
            Suspected AL
          </span>
        </div>
        <span className="text-xl font-mono font-black text-primary ml-5 block leading-none">
          {typeof suspectedAL === 'string' ? suspectedAL : suspectedAL}
        </span>
      </div>
    </div>
  );
}

interface InjuryListProps {
  injuries: string[];
}

function InjuryList({ injuries }: InjuryListProps) {
  return (
    <div className="pt-4 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-none bg-destructive/10 border border-destructive/20">
          <ShieldAlert className="h-3 w-3 text-destructive" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-destructive/60">
          Documented Tissue Damage
        </span>
      </div>
      <div className="flex flex-wrap gap-2 ml-7">
        {injuries.map((injury, idx) => (
          <Badge
            key={idx}
            variant="outline"
            className="text-[9px] font-black uppercase tracking-widest bg-destructive/5 text-destructive border-destructive/30 px-2 py-0.5 rounded-none"
          >
            {injury}
          </Badge>
        ))}
      </div>
    </div>
  );
}
