import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { computeTrainability } from '@/engine/training/burnAnalysis';

interface WarriorSelectorProps {
  warriors: Warrior[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  trainers: Trainer[];
}

export function WarriorSelector({
  warriors,
  selectedId,
  onSelect,
  trainers,
}: WarriorSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {warriors.map((warrior) => {
        const isSelected = warrior.id === selectedId;
        const trainability = computeTrainability(warrior, trainers);
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
            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
              {trainability}% Growth Potential
            </span>
          </button>
        );
      })}
    </div>
  );
}
