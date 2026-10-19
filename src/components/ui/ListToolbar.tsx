import { Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { ListShell, SortOption } from '@/hooks/useListShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Search + sort + window controls for a `useListShell` list. */
export function ListToolbar<T>({
  list,
  sorts,
  placeholder = 'Search…',
  ariaLabel = 'Filter list',
}: {
  list: ListShell<T>;
  sorts: SortOption<T>[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const hidden = list.filtered.length - list.visible.length;
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
        <Input
          value={list.query}
          onChange={(e) => list.setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-7 pl-7 text-[10px] font-bold uppercase tracking-widest bg-neutral-900/60 border-white/10 rounded-none"
        />
      </div>
      <Select value={list.sortId} onValueChange={list.setSortId}>
        <SelectTrigger
          aria-label="Sort list"
          className="h-7 w-[110px] text-[9px] font-black uppercase tracking-widest bg-neutral-900/60 border-white/10 rounded-none"
        >
          <ArrowUpDown className="h-3 w-3 mr-1 opacity-50" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sorts.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-[10px]">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(hidden > 0 || list.showAll) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => list.setShowAll(!list.showAll)}
          className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground"
        >
          {list.showAll ? (
            <>
              Top {list.visible.length} <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              +{hidden} more <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
