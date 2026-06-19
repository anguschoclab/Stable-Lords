import { BrainCircuit, AlertTriangle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData } from '@/types/game';
import type { FightPlan } from '@/types/shared.types';
import { modLabel } from '../utils/modLabel';

interface DoctrineIntelligenceSectionProps {
  rivalA: RivalStableData;
  rivalB: RivalStableData;
  modsA: Partial<FightPlan>;
  modsB: Partial<FightPlan>;
  clashes: boolean;
  grudge: { intensity: number; reason: string } | null;
}

/**
 *
 */
export function DoctrineIntelligenceSection({
  rivalA,
  rivalB,
  modsA,
  modsB,
  clashes,
  grudge,
}: DoctrineIntelligenceSectionProps) {
  return (
    <Surface variant="glass" padding="none" className="border-arena-gold/10 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-arena-gold/5 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-arena-gold/10 border border-arena-gold/20">
          <BrainCircuit className="h-3.5 w-3.5 text-arena-gold" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-arena-gold">
          Stable Doctrine
        </h3>
        {clashes && (
          <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-arena-gold/70">
            <AlertTriangle className="h-3 w-3" />
            Clash of Philosophies
          </div>
        )}
        {grudge && (
          <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-arena-blood">
            {Array.from({ length: grudge.intensity }).map((_, i) => (
              <Flame key={i} className="h-3 w-3" style={{ opacity: 0.4 + i * 0.12 }} />
            ))}
            Active Grudge · {grudge.reason}
          </div>
        )}
      </div>
      <div className="p-6 grid grid-cols-2 gap-8">
        {[
          {
            rival: rivalA,
            mods: modsA,
            color: 'text-primary',
            borderColor: 'border-primary/20',
            bgColor: 'bg-primary/5',
          },
          {
            rival: rivalB,
            mods: modsB,
            color: 'text-accent',
            borderColor: 'border-accent/20',
            bgColor: 'bg-accent/5',
          },
        ].map(({ rival, mods, color, borderColor, bgColor }) => (
          <div key={rival.owner.id} className={cn('p-4 border rounded-none', borderColor, bgColor)}>
            <div
              className={cn(
                'text-[9px] font-black uppercase tracking-widest mb-3 opacity-60',
                color
              )}
            >
              {rival.owner.stableName}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                  Personality
                </span>
                <span className={cn('font-black', color)}>{rival.owner.personality}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                  Philosophy
                </span>
                <span className="font-black text-foreground/80">{rival.philosophy ?? '—'}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                  Adaptation
                </span>
                <span className="font-black text-foreground/60">
                  {rival.owner.metaAdaptation ?? '—'}
                </span>
              </div>
              {Object.keys(mods).length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                    Combat Modifiers
                  </div>
                  {(mods.OE ?? undefined) !== undefined && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground/50">Offensive Effort</span>
                      <span
                        className={cn(
                          'font-mono font-black',
                          (mods.OE ?? 0) > 0 ? 'text-arena-blood' : 'text-arena-pop'
                        )}
                      >
                        {modLabel(mods.OE ?? 0)}
                      </span>
                    </div>
                  )}
                  {(mods.AL ?? undefined) !== undefined && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground/50">Activity Level</span>
                      <span
                        className={cn(
                          'font-mono font-black',
                          (mods.AL ?? 0) > 0 ? 'text-arena-blood' : 'text-arena-pop'
                        )}
                      >
                        {modLabel(mods.AL ?? 0)}
                      </span>
                    </div>
                  )}
                  {(mods.killDesire ?? undefined) !== undefined && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground/50">Kill Desire</span>
                      <span
                        className={cn(
                          'font-mono font-black',
                          (mods.killDesire ?? 0) > 0 ? 'text-arena-blood' : 'text-arena-pop'
                        )}
                      >
                        {modLabel(mods.killDesire ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
