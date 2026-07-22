import { cn } from '@/lib/utils';
import { ScrollText, Swords } from 'lucide-react'; /**
 * View mode type.
 */

/**
 * View mode type.
 */
export type ViewMode = 'log' | 'arena';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  className?: string;
} /**
   * View mode toggle.
   * @param  - {
  mode,
  on change,
  disabled = false,
  class name,
}.
   */

/**
 * View mode toggle.
 * @param  - {
  mode,
  on change,
  disabled = false,
  class name,
}.
 */
export default function ViewModeToggle({
  mode,
  onChange,
  disabled = false,
  className,
}: ViewModeToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-none border border-border/50 bg-secondary/30',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        onClick={() => onChange('log')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
          mode === 'log'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
        disabled={disabled}
        aria-label="Switch to Combat Log view"
        aria-pressed={mode === 'log'}
      >
        <ScrollText className="h-3.5 w-3.5" />
        <span>Combat Log</span>
      </button>

      <button
        onClick={() => onChange('arena')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
          mode === 'arena'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
        disabled={disabled}
        aria-label="Switch to Arena Replay view"
        aria-pressed={mode === 'arena'}
      >
        <Swords className="h-3.5 w-3.5" />
        <span>Arena Replay</span>
      </button>
    </div>
  );
}
