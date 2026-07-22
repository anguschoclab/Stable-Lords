import { cn } from '@/lib/utils';

export interface FighterHp {
  hp: number;
  max: number;
  label?: string;
}

interface FaceoffBarProps {
  fighterA: FighterHp;
  fighterB: FighterHp;
  className?: string;
}

/**
 * Symmetric face-off bar: Fighter A fills left-from-center, Fighter B fills right-from-center.
 * Each side occupies 50% of the total width, proportional to remaining HP.
 */
export function FaceoffBar({ fighterA, fighterB, className }: FaceoffBarProps) {
  const { hp: hpA, max: maxA, label: labelA = 'A' } = fighterA;
  const { hp: hpB, max: maxB, label: labelB = 'B' } = fighterB;
  const pctA = maxA > 0 ? Math.min(50, Math.max(0, (hpA / maxA) * 50)) : 0;
  const pctB = maxB > 0 ? Math.min(50, Math.max(0, (hpB / maxB) * 50)) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-[9px] font-mono font-black text-muted-foreground/60 uppercase tracking-widest">
        <span className="text-primary">{labelA}</span>
        <span className="text-destructive">{labelB}</span>
      </div>
      <div className="relative h-3 bg-white/5 rounded-none overflow-hidden border border-white/5">
        <div className="absolute inset-0 flex items-stretch">
          <div
            data-testid="faceoff-fill-a"
            className="bg-primary transition-all motion-reduce:transition-none motion-reduce:transform-none duration-700 ease-out absolute right-1/2 top-0 bottom-0"
            style={{ width: `${pctA}%` }}
          />
          <div
            data-testid="faceoff-fill-b"
            className="bg-destructive transition-all motion-reduce:transition-none motion-reduce:transform-none duration-700 ease-out absolute left-1/2 top-0 bottom-0"
            style={{ width: `${pctB}%` }}
          />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
      </div>
      <div className="flex justify-between text-[10px] font-mono font-black">
        <span className={cn(hpA <= 0 ? 'text-destructive' : 'text-primary')}>
          {Math.max(0, hpA)}/{maxA}
        </span>
        <span className={cn(hpB <= 0 ? 'text-destructive' : 'text-primary')}>
          {Math.max(0, hpB)}/{maxB}
        </span>
      </div>
    </div>
  );
}
