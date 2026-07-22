import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Skull, Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

interface FallenLegendsTabProps {
  graveyard: Warrior[];
  retired: Warrior[];
}

/**
 *
 */
export function FallenLegendsTab({ graveyard, retired }: FallenLegendsTabProps) {
  const fallen = [
    ...(graveyard ?? []).map((w) => ({
      name: w.name,
      style: w.style,
      kind: 'fallen' as const,
      fame: w.fame ?? 0,
      week: w.deathWeek,
    })),
    ...(retired ?? []).map((w) => ({
      name: w.name,
      style: w.style,
      kind: 'retired' as const,
      fame: w.fame ?? 0,
      week: w.retiredWeek ?? 0,
    })),
  ]
    .sort((a, b) => b.fame - a.fame)
    .slice(0, 12);

  if (fallen.length === 0) {
    return (
      <Surface
        variant="glass"
        className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
      >
        <ImperialRing size="lg" variant="bronze" className="opacity-20">
          <Skull className="h-8 w-8" />
        </ImperialRing>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
          No legends memorialized in the archives.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionDivider label="Fallen Legends" variant="blood" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fallen.map((w, i) => (
          <Surface
            key={`${w.kind}-${w.name}-${i}`}
            variant="glass"
            className="p-6 border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all motion-reduce:transition-none motion-reduce:transform-none"
          >
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  'p-3 border transition-all',
                  w.kind === 'fallen'
                    ? 'bg-destructive/5 border-destructive/20 text-destructive'
                    : 'bg-white/5 border-white/10 text-muted-foreground/40'
                )}
              >
                {w.kind === 'fallen' ? (
                  <Skull className="h-4 w-4" />
                ) : (
                  <Armchair className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground">
                  {w.name}
                </span>
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                  {STYLE_DISPLAY_NAMES[w.style as FightingStyle] ?? w.style} ·{' '}
                  {w.kind === 'fallen' ? 'Fallen' : 'Retired'} · Wk {w.week}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground/30 text-[8px] font-black uppercase tracking-widest block mb-1">
                Fame
              </span>
              <span className="font-display font-black text-arena-gold text-xl leading-none">
                {w.fame}
              </span>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
