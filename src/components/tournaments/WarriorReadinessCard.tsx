import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FATIGUE_FRESH, FATIGUE_ELEVATED } from '@/engine/core/fatigueUtils';
import type { Warrior } from '@/types/game';

function getFatigueLabel(fatigue: number | undefined): { label: string; color: string } {
  const f = fatigue ?? 0;
  if (f < FATIGUE_FRESH) return { label: 'Fresh', color: 'text-primary' };
  if (f < FATIGUE_ELEVATED) return { label: 'Tired', color: 'text-arena-gold' };
  return { label: 'Exhausted', color: 'text-destructive' };
}

interface WarriorReadinessCardProps {
  warrior: Warrior;
}

/**
 * Per-warrior readiness card: name, injury/nominal status, fatigue label and bar.
 */
export function WarriorReadinessCard({ warrior }: WarriorReadinessCardProps) {
  const { label: fatigueLabel, color: fatigueColor } = getFatigueLabel(warrior.fatigue);
  const hasInjuries = warrior.injuries && warrior.injuries.length > 0;
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-black uppercase tracking-tight text-foreground/90">
          {warrior.name}
        </span>
        {hasInjuries ? (
          <div className="flex items-center gap-1.5 text-destructive animate-pulse">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {warrior.injuries.length === 1
                ? warrior.injuries[0]?.severity
                : `${warrior.injuries.length} INJURIES`}
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
              'h-full transition-all',
              (warrior.fatigue ?? 0) < FATIGUE_FRESH
                ? 'bg-primary'
                : (warrior.fatigue ?? 0) < FATIGUE_ELEVATED
                  ? 'bg-arena-gold'
                  : 'bg-destructive'
            )}
            style={{ width: `${Math.min(100, warrior.fatigue ?? 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
