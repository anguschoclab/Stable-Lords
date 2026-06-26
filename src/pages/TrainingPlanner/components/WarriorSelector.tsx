import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/state.types';

interface WarriorSelectorProps {
  warriors: Warrior[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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
            className={cn(
              'flex flex-col gap-1 p-4 border transition-all text-left group',
              isSelected
                ? 'bg-white/[0.05] border-white/20'
                : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
            )}
          >
            <span
              className={cn(
                'text-[10px] font-black uppercase tracking-widest',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {warrior.name}
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
