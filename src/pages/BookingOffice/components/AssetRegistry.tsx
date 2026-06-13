import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { Warrior } from '@/types/state.types';
import { getFatigueStatus } from '../hooks/useBookingOffice';

interface AssetRegistryProps {
  roster: Warrior[];
  boutOffers: Record<string, { warriorIds: string[]; status: string }>;
  selectedWarriorId: string | null;
  onSelect: (id: string | null) => void;
}

export function AssetRegistry({
  roster,
  boutOffers,
  selectedWarriorId,
  onSelect,
}: AssetRegistryProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {roster.map((warrior) => {
        const hasAccepted = Object.values(boutOffers).some(
          (o) => o.warriorIds.includes(warrior.id) && o.status === 'Signed'
        );
        const isSelected = selectedWarriorId === warrior.id;
        const fatigueConfig = getFatigueStatus(warrior.fatigue ?? 0);

        return (
          <button
            key={warrior.id}
            onClick={() => onSelect(isSelected ? null : warrior.id)}
            className={cn(
              'flex flex-col gap-1 p-4 border transition-all text-left group relative overflow-hidden',
              isSelected
                ? 'bg-white/[0.05] border-white/20'
                : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0',
              hasAccepted && 'border-l-4 border-l-primary'
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest',
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {warrior.name}
              </span>
              {hasAccepted && <CheckCircle2 className="h-3 w-3 text-primary" />}
            </div>
            <span
              className={cn(
                'text-[8px] font-black uppercase tracking-tighter',
                fatigueConfig.color
              )}
            >
              {fatigueConfig.label} Readiness
            </span>
          </button>
        );
      })}
    </div>
  );
}
