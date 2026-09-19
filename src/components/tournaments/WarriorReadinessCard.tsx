import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFatigueBand } from '@/engine/core/fatigueUtils';
import { hasInjuries, countInjuries } from '@/engine/injuries/utils';
import type { Warrior } from '@/types/game';

const FATIGUE_LABELS = {
  fresh: { label: 'Fresh', color: 'text-primary', bar: 'bg-primary' },
  elevated: { label: 'Tired', color: 'text-arena-gold', bar: 'bg-arena-gold' },
  exhausted: { label: 'Exhausted', color: 'text-destructive', bar: 'bg-destructive' },
} as const;

function getFatigueLabel(fatigue: number | undefined): { label: string; color: string } {
  return FATIGUE_LABELS[getFatigueBand(fatigue ?? 0)];
}

interface WarriorReadinessCardProps {
  warrior: Warrior;
}

/**
 * Per-warrior readiness card: name, injury/nominal status, fatigue label and bar.
 */
export function WarriorReadinessCard({ warrior }: WarriorReadinessCardProps) {
  const { label: fatigueLabel, color: fatigueColor } = getFatigueLabel(warrior.fatigue);
  const injured = hasInjuries(warrior);
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all motion-reduce:transition-none">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-black uppercase tracking-tight text-foreground/90">
          {warrior.name}
        </span>
        {injured ? (
          <div className="flex items-center gap-1.5 text-destructive animate-pulse motion-reduce:animate-none">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {countInjuries(warrior) === 1
                ? warrior.injuries[0]?.severity
                : `${countInjuries(warrior)} INJURIES`}
            </span>
          </div>
        ) : (
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
            Status: Nominal
          </span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className={cn('text-[9px] font-black uppercase tracking-widest', fatigueColor)}>
          {fatigueLabel}
        </span>
        <div className="h-1 w-12 bg-white/5 mt-1">
          <div
            className={cn(
              'h-full transition-all motion-reduce:transition-none',
              FATIGUE_LABELS[getFatigueBand(warrior.fatigue ?? 0)].bar
            )}
            style={{ width: `${Math.min(100, warrior.fatigue ?? 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
