import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import type { Warrior } from '@/types/game';

interface WarriorSelectorProps {
  warriors: { warrior: Warrior; stable: string }[];
  selectedId: string | null;
  otherId: string | null;
  onSelect: (id: string) => void;
  label: string;
  colorVariant: 'primary' | 'accent';
}

export function WarriorSelector({
  warriors,
  selectedId,
  otherId,
  onSelect,
  label,
  colorVariant,
}: WarriorSelectorProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      text: 'text-primary',
      hover: 'hover:border-primary/40 hover:bg-primary/5',
    },
    accent: {
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      text: 'text-accent',
      hover: 'hover:border-accent/40 hover:bg-accent/5',
    },
  };

  const colors = colorClasses[colorVariant];

  return (
    <Surface variant="glass" className="border-border/40 space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-1 px-2 rounded-none border', colors.bg, colors.border)}>
          <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', colors.text)}>
            {label}
          </span>
        </div>
        <div className={cn('h-px flex-1 bg-gradient-to-r border/20 via-border/20 to-transparent', 'from-' + colors.text.replace('text-', '') + '/20')} />
      </div>

      <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="grid grid-cols-1 gap-2">
          {warriors.map((entry) => (
            <WarriorSelectionCard
              key={entry.warrior.id}
              warrior={entry.warrior}
              stable={entry.stable}
              isSelected={selectedId === entry.warrior.id}
              isDisabled={otherId === entry.warrior.id}
              onSelect={() => onSelect(entry.warrior.id as string)}
              colorVariant={colorVariant}
            />
          ))}
        </div>
      </div>
    </Surface>
  );
}

interface WarriorSelectionCardProps {
  warrior: Warrior;
  stable: string;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  colorVariant: 'primary' | 'accent';
}

function WarriorSelectionCard({
  warrior,
  stable,
  isSelected,
  isDisabled,
  onSelect,
  colorVariant,
}: WarriorSelectionCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10',
      border: 'border-primary',
      text: 'text-primary',
      shadow: 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]',
    },
    accent: {
      bg: 'bg-accent/10',
      border: 'border-accent',
      text: 'text-accent',
      shadow: 'shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]',
    },
  };

  const colors = colorClasses[colorVariant];

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        'w-full text-left p-3 rounded-none border transition-all relative group/selection outline-none',
        isSelected
          ? cn(colors.bg, colors.border, colors.shadow)
          : isDisabled
            ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
            : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-none border transition-all',
              isSelected
                ? colors.bg + ' ' + colors.border + ' ' + colors.text
                : 'bg-neutral-800 text-muted-foreground border-white/5'
            )}
          >
            <span className="text-xs font-black">{warrior.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'font-display font-black text-sm uppercase tracking-tight transition-colors truncate',
                isSelected ? colors.text : 'text-muted-foreground'
              )}
            >
              {warrior.name}
            </div>
            <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
              {stable}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-muted-foreground/40">
            {warrior.age}y
          </span>
          {isSelected && (
            <div className={cn('w-2 h-2 rounded-full animate-pulse', colors.bg, colors.text)} />
          )}
        </div>
      </div>
    </button>
  );
}
