import { ArrowLeftRight } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { Warrior } from '@/types/game';

interface WarriorComparisonHeaderProps {
  warriorA: Warrior | undefined;
  warriorB: Warrior | undefined;
}

/**
 *
 */
export function WarriorComparisonHeader({ warriorA, warriorB }: WarriorComparisonHeaderProps) {
  return (
    <Surface
      variant="glass"
      padding="none"
      className="p-8 border-border/40 relative overflow-hidden flex items-center justify-between"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="text-center flex-1 relative z-10 space-y-4">
        <h4 className="text-[10px] font-black tracking-[0.4em] text-primary uppercase leading-none opacity-60">
          Challenger
        </h4>
        <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">
          {warriorA?.name || 'Not Selected'}
        </h3>
        {warriorA && (
          <div className="flex justify-center">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
              {warriorA.age} years · {warriorA.status}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center mx-12 relative z-10">
        <div className="p-3 rounded-full bg-neutral-900 border border-white/5 shadow-inner">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <span className="text-[9px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase mt-4">
          VS
        </span>
      </div>

      <div className="text-center flex-1 relative z-10 space-y-4">
        <h4 className="text-[10px] font-black tracking-[0.4em] text-accent uppercase leading-none opacity-60">
          Defender
        </h4>
        <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">
          {warriorB?.name || 'Not Selected'}
        </h3>
        {warriorB && (
          <div className="flex justify-center">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
              {warriorB.age} years · {warriorB.status}
            </span>
          </div>
        )}
      </div>
    </Surface>
  );
}
