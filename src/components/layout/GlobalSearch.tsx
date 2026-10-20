/**
 * GlobalSearch — always-visible entity finder in the nav rail.
 * Substring search over the unified entity index (warriors across every
 * pool, stables, promoters, trainers), grouped results, keyboard nav,
 * and direct navigation to each entity's detail route.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { Search, User, Landmark, Building2, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/state/useGameStore';
import { searchEntities, type SearchEntry } from '@/engine/core/entityIndex';

const EMPTY: SearchEntry[] = [];

const TYPE_CONFIG: Record<SearchEntry['type'], { label: string; icon: React.ElementType }> = {
  warrior: { label: 'Warriors', icon: User },
  stable: { label: 'Stables', icon: Landmark },
  promoter: { label: 'Promoters', icon: Building2 },
  trainer: { label: 'Trainers', icon: GraduationCap },
};

const BADGE_CLASSES: Record<NonNullable<SearchEntry['badge']>, string> = {
  Yours: 'bg-primary/15 text-primary border-primary/30',
  Rival: 'bg-arena-blood/15 text-arena-blood border-arena-blood/30',
  Fallen: 'bg-white/5 text-muted-foreground border-white/10',
  Retired: 'bg-arena-gold/10 text-arena-gold border-arena-gold/30',
};

interface KeydownCtx {
  open: boolean;
  results: SearchEntry[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  setOpen: (open: boolean) => void;
  activate: (entry: SearchEntry) => void;
}

/** Combobox keyboard behavior: ↑↓ cycles, Enter activates, Esc closes. */
function handleListKey(e: React.KeyboardEvent, ctx: KeydownCtx): void {
  const { open, results, activeIndex, setActiveIndex, setOpen, activate } = ctx;
  if (!open || results.length === 0) {
    if (e.key === 'Escape') setOpen(false);
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActiveIndex((i) => (i + 1) % results.length);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveIndex((i) => (i - 1 + results.length) % results.length);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const entry = results[Math.min(activeIndex, results.length - 1)];
    if (entry) activate(entry);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setOpen(false);
    (e.target as HTMLElement).blur();
  }
}

interface GlobalSearchProps {
  /** Called after a result activates — lets the mobile drawer close. */
  onNavigate?: () => void;
  /**
   * `overlay` (default) floats results over content; `inline` renders them
   * in-flow — required inside the overflow-clipped mobile drawer.
   */
  variant?: 'overlay' | 'inline';
}

function groupByType(results: SearchEntry[]): [SearchEntry['type'], SearchEntry[]][] {
  const order: SearchEntry['type'][] = ['warrior', 'stable', 'promoter', 'trainer'];
  const groups: [SearchEntry['type'], SearchEntry[]][] = [];
  for (const type of order) {
    const entries = results.filter((r) => r.type === type);
    if (entries.length > 0) groups.push([type, entries]);
  }
  return groups;
}

interface Selection {
  activeIndex: number;
  onHover: (index: number) => void;
  onActivate: (entry: SearchEntry) => void;
}

/** One result row — combobox `option` with name, subtitle, and badge. */
function ResultOption({
  entry,
  index,
  selection,
}: {
  entry: SearchEntry;
  index: number;
  selection: Selection;
}) {
  const active = index === selection.activeIndex;
  return (
    <button
      id={`gs-option-${index}`}
      role="option"
      aria-selected={active}
      onMouseEnter={() => selection.onHover(index)}
      onClick={() => selection.onActivate(entry)}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors motion-reduce:transition-none',
        active ? 'bg-primary/10' : 'hover:bg-white/5'
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate font-display text-[11px] font-black uppercase tracking-tight',
            active ? 'text-primary' : 'text-foreground'
          )}
        >
          {entry.name}
        </span>
        <span className="block truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {entry.subtitle}
        </span>
      </span>
      {entry.badge && (
        <span
          className={cn(
            'shrink-0 border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest',
            BADGE_CLASSES[entry.badge]
          )}
        >
          {entry.badge}
        </span>
      )}
    </button>
  );
}

interface ResultsPanelProps {
  listboxId: string;
  variant: NonNullable<GlobalSearchProps['variant']>;
  query: string;
  results: SearchEntry[];
  selection: Selection;
}

/** Grouped results dropdown — overlay (desktop rail) or inline (drawer). */
function SearchResultsPanel({ listboxId, variant, query, results, selection }: ResultsPanelProps) {
  let flatIndex = -1;
  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label="Search results"
      className={cn(
        'max-h-96 overflow-y-auto border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl',
        variant === 'overlay' ? 'absolute left-2 top-full z-50 w-80' : 'mt-1 w-full'
      )}
    >
      {results.length === 0 ? (
        <p className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">
          No souls answer to “{query}”
        </p>
      ) : (
        groupByType(results).map(([type, entries]) => {
          const { label, icon: Icon } = TYPE_CONFIG[type];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <Icon className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
                  {label}
                </span>
              </div>
              {entries.map((entry) => {
                flatIndex += 1;
                const idx = flatIndex;
                return (
                  <ResultOption
                    key={`${entry.type}:${entry.id}`}
                    entry={entry}
                    index={idx}
                    selection={selection}
                  />
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

interface SearchFieldProps {
  query: string;
  enabled: boolean;
  hasResults: boolean;
  activeIndex: number;
  listboxId: string;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/** The combobox input — `#global-search-input` is the `/` shortcut target. */
function SearchField(props: SearchFieldProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
      <Input
        id="global-search-input"
        role="combobox"
        aria-expanded={props.enabled}
        aria-controls={props.listboxId}
        aria-activedescendant={
          props.enabled && props.hasResults ? `gs-option-${props.activeIndex}` : undefined
        }
        aria-label="Search warriors, stables, promoters"
        autoComplete="off"
        value={props.query}
        placeholder="Search…  ( / )"
        onFocus={props.onOpen}
        onChange={(e) => props.onQueryChange(e.target.value)}
        onKeyDown={props.onKeyDown}
        className="h-8 pl-7 text-[10px] font-bold uppercase tracking-widest bg-neutral-900/60 border-white/10 rounded-none"
      />
    </div>
  );
}

/**
 * Nav-rail entity search input with a grouped, keyboard-navigable results
 * dropdown. Focusable via the global `/` shortcut (`#global-search-input`).
 */
export function GlobalSearch({ onNavigate, variant = 'overlay' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const q = query.trim();
  const enabled = open && q.length >= 2;
  const results = useGameStore(useShallow((s) => (enabled ? searchEntities(s, q, 12) : EMPTY)));

  // Click-outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const activate = (entry: SearchEntry) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    onNavigate?.();
    navigate({ to: entry.to as never });
  };

  const onKeyDown = (e: React.KeyboardEvent) =>
    handleListKey(e, {
      open,
      results,
      activeIndex,
      setActiveIndex,
      setOpen,
      activate,
    });

  const listboxId = 'global-search-results';

  return (
    <div ref={rootRef} className="relative px-2 pb-2">
      <SearchField
        query={query}
        enabled={enabled}
        hasResults={results.length > 0}
        activeIndex={activeIndex}
        listboxId={listboxId}
        onQueryChange={(v) => {
          setQuery(v);
          setOpen(true);
          setActiveIndex(0);
        }}
        onOpen={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {enabled && (
        <SearchResultsPanel
          listboxId={listboxId}
          variant={variant}
          query={q}
          results={results}
          selection={{ activeIndex, onHover: setActiveIndex, onActivate: activate }}
        />
      )}
    </div>
  );
}
