import { cn } from '@/lib/utils';
import { compactSelectRowClasses, compactSelectNameClasses } from '@/components/ui/selectableRow';
import type { Warrior } from '@/types/state.types';
import { warriorDisplayName } from '@/utils/warriorDisplay';

interface WarriorSelectorProps {
  warriors: Warrior[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 *
 */
export function WarriorSelector({ warriors, selectedId, onSelect }: WarriorSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {warriors.map((warrior) => {
        const isSelected = warrior.id === selectedId;
        const hasPlan = !!warrior.plan;
        return (
          <button
            key={warrior.id}
            onClick={() => onSelect(warrior.id)}
            className={compactSelectRowClasses(isSelected)}
          >
            <span className={compactSelectNameClasses(isSelected)}>
              {warriorDisplayName(warrior)}
            </span>
            <span
              className={cn(
                'text-[9px] font-black uppercase tracking-tighter',
                hasPlan ? 'text-primary' : 'text-muted-foreground/40'
              )}
            >
              {hasPlan ? 'Plan Set' : 'No Plan'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
