import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import type { Warrior } from '@/types/state.types';

interface WarriorSelectorProps {
  warriors: Warrior[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function WarriorSelector({ warriors, selectedId, onSelect }: WarriorSelectorProps) {
  if (warriors.length === 0) {
    return (
      <div className="p-10 text-center border border-dashed border-white/10 opacity-30">
        <p className="text-[8px] font-black uppercase tracking-widest">No Warriors</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {warriors.map((w) => (
        <button
          key={w.id}
          onClick={() => onSelect(w.id)}
          className={cn(
            'w-full flex items-center justify-between p-3 border transition-all duration-300',
            selectedId === w.id
              ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                selectedId === w.id ? 'bg-primary animate-pulse' : 'bg-white/20'
              )}
            />
            <div className="flex flex-col items-start min-w-0">
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest truncate',
                  selectedId === w.id ? 'text-primary' : 'text-foreground'
                )}
              >
                {w.name}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground/60 mt-0.5">
                FAME: {w.fame}
              </span>
            </div>
          </div>
          {selectedId === w.id && <Activity className="h-3 w-3 text-primary" />}
        </button>
      ))}
    </div>
  );
}
