import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { CheckCircle2, Target } from 'lucide-react';

interface WarriorTargetCardProps {
  warrior: { id: string; name: string; style: string };
  isSelected: boolean;
  isRevealed: boolean;
  isRevealing: boolean;
  onSelect: () => void;
}

export function WarriorTargetCard({
  warrior,
  isSelected,
  isRevealed,
  isRevealing,
  onSelect,
}: WarriorTargetCardProps) {
  return (
    <Surface
      variant={isSelected ? 'gold' : 'glass'}
      padding="none"
      className={cn(
        'transition-all border text-center overflow-hidden relative',
        isSelected
          ? 'border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] bg-primary/20'
          : isRevealed
            ? 'opacity-20 grayscale border-white/5 bg-transparent'
            : 'border-white/5 hover:border-white/20'
      )}
    >
      <button
        aria-label={`Select warrior ${warrior.name} for insight`}
        disabled={isRevealed || isRevealing}
        onClick={onSelect}
        className="w-full p-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <span className="block text-[10px] font-black uppercase tracking-widest mb-1 truncate">
          {warrior.name}
        </span>
        {isRevealed ? (
          <CheckCircle2 className="h-4 w-4 mx-auto text-primary" />
        ) : (
          <div className="text-[9px] font-black font-mono opacity-40 uppercase">
            {warrior.style.slice(0, 3)}
          </div>
        )}
      </button>
      {isSelected && (
        <div className="absolute top-0 right-0 p-1">
          <Target className="h-3 w-3 text-primary animate-pulse" />
        </div>
      )}
    </Surface>
  );
}
