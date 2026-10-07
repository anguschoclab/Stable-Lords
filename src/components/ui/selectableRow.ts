import { cn } from '@/lib/utils';

/**
 * Class-name composers for the app's two selectable-row idioms.
 * Component-level shell (Surface + tooltip + accent bar) lives in
 * SelectableCard.tsx — these cover the lighter variants where callers keep
 * their own markup but share the state styling.
 */

/**
 * Row-shell classes for icon-box style selectors (scouting StableSelector /
 * WarriorSelector): full-width padded border row, focus-visible ring, and the
 * shared selected → disabled → inactive state chain.
 * @param opts.selected - Whether the row is the current pick.
 * @param opts.disabled - Whether the row is the other column's pick (muted).
 * @param opts.selectedClasses - Tone-specific classes for the selected state.
 */
export function selectionRowClasses(opts: {
  selected?: boolean;
  disabled?: boolean;
  selectedClasses: string;
}): string {
  const { selected, disabled, selectedClasses } = opts;
  return cn(
    'w-full text-left p-3 rounded-none border transition-all motion-reduce:transition-none motion-reduce:transform-none relative group/selection focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    selected
      ? selectedClasses
      : disabled
        ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
        : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
  );
}

/**
 * Compact vertical button-row classes (BookingOffice AssetRegistry /
 * TrainingPlanner WarriorSelector): unselected rows dim to grayscale and
 * restore on hover.
 * @param selected - Whether the row is the current pick.
 * @param extra - Caller-specific classes merged last (e.g. left accent bars).
 */
export function compactSelectRowClasses(selected: boolean, extra?: string): string {
  return cn(
    'flex flex-col gap-1 p-4 border transition-all text-left group motion-reduce:transition-none',
    selected
      ? 'bg-white/[0.05] border-white/20'
      : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0',
    extra
  );
}

/**
 * Name-label classes inside a compact select row — bright when selected,
 * muted otherwise.
 * @param selected - Whether the row is the current pick.
 */
export function compactSelectNameClasses(selected: boolean): string {
  return cn(
    'text-[10px] font-black uppercase tracking-widest',
    selected ? 'text-foreground' : 'text-muted-foreground'
  );
}
