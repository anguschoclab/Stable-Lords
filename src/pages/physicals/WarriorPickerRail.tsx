import { Badge } from '@/components/ui/badge';
import { FightingStyle, STYLE_ABBREV, type Warrior } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';

interface WarriorPickerRailProps {
  warriors: Warrior[];
  fighterAId: string | null;
  fighterBId: string | null;
  onSelect: (warrior: Warrior) => void;
}

/** Left rail: active-roster picker that fills fighter slots A and B. */
export function WarriorPickerRail({
  warriors,
  fighterAId,
  fighterBId,
  onSelect,
}: WarriorPickerRailProps) {
  return (
    <aside className="lg:col-span-3 space-y-6 sticky top-6">
      <div className="px-1 flex items-center justify-between">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
          Select Warriors
        </span>
      </div>

      <Surface
        variant="glass"
        className="p-0 border-white/5 max-h-[600px] overflow-y-auto thin-scrollbar"
      >
        {warriors.map((warrior: Warrior) => {
          const inA = fighterAId === warrior.id;
          const inB = fighterBId === warrior.id;

          return (
            <button
              key={warrior.id}
              onClick={() => onSelect(warrior)}
              className={cn(
                'w-full text-left p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-all motion-reduce:transition-none',
                inA
                  ? 'bg-primary/10 border-l-4 border-l-primary'
                  : inB
                    ? 'bg-destructive/10 border-l-4 border-l-destructive'
                    : 'hover:bg-white/[0.02]'
              )}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs font-black uppercase truncate',
                    inA ? 'text-primary' : inB ? 'text-destructive' : ''
                  )}
                >
                  {warrior.name}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase mt-1">
                  {STYLE_ABBREV[warrior.style as FightingStyle] ?? warrior.style}
                </p>
              </div>
              {inA && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black h-4 px-1">
                  A
                </Badge>
              )}
              {inB && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[8px] font-black h-4 px-1">
                  B
                </Badge>
              )}
            </button>
          );
        })}
      </Surface>

      <div className="p-4 bg-secondary/10 border border-white/5">
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          "Calculated risk is the bridge between a legend and a corpse. Run the numbers before
          you run the sand."
        </p>
      </div>
    </aside>
  );
}
