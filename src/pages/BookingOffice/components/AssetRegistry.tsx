import { cn } from '@/lib/utils';
import { compactSelectRowClasses, compactSelectNameClasses } from '@/components/ui/selectableRow';
import { CheckCircle2 } from 'lucide-react';
import type { Warrior } from '@/types/state.types';
import { getFatigueStatus } from '../hooks/useBookingOffice';
import { warriorDisplayName } from '@/utils/warriorDisplay';

interface AssetRegistryProps {
  roster: Warrior[];
  boutOffers: Record<string, { warriorIds: string[]; status: string }>;
  selectedWarriorId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 *
 */
export function AssetRegistry({
  roster,
  boutOffers,
  selectedWarriorId,
  onSelect,
}: AssetRegistryProps) {
  // Warriors with a Signed bout — inverted once from the offers instead of
  // re-scanning every offer per roster row.
  const signedWarriorIds = new Set(
    Object.values(boutOffers).flatMap((o) => (o.status === 'Signed' ? o.warriorIds : []))
  );
  return (
    <div className="grid grid-cols-1 gap-3">
      {roster.map((warrior) => {
        const hasAccepted = signedWarriorIds.has(warrior.id);
        const isSelected = selectedWarriorId === warrior.id;
        const fatigueConfig = getFatigueStatus(warrior.fatigue ?? 0);

        return (
          <button
            key={warrior.id}
            onClick={() => onSelect(isSelected ? null : warrior.id)}
            className={compactSelectRowClasses(
              isSelected,
              cn('relative overflow-hidden', hasAccepted && 'border-l-4 border-l-primary')
            )}
          >
            <div className="flex items-center justify-between">
              <span className={compactSelectNameClasses(isSelected)}>
                {warriorDisplayName(warrior)}
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
