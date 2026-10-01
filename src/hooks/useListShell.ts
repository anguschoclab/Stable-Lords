import { useMemo, useState } from 'react';

/**
 * Shared list shell for the living world — at 90–200 rival stables every
 * rostered view needs the same three affordances: name search, a real sort,
 * and a bounded render window with "show all". Generic over the row type so
 * scouting lists, standings tables, and selectors share one behavior.
 */
export interface SortOption<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

/** Options controlling how a `useListShell` list filters, sorts, and windows. */
export interface ListShellOptions<T> {
  /** Lowercased substrings an item must match against the query. */
  searchText: (item: T) => string[];
  sorts: SortOption<T>[];
  defaultSortId?: string;
  /** Rows rendered before "show all" kicks in. Default 25. */
  pageSize?: number;
}

/** Search/sort/window state returned by `useListShell`. */
export interface ListShell<T> {
  query: string;
  setQuery: (q: string) => void;
  sortId: string;
  setSortId: (id: string) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  /** Items after search + sort + windowing — render these. */
  visible: T[];
  /** Items after search + sort, before windowing. */
  filtered: T[];
  total: number;
}

/** Search + sort + bounded-window state for a list, generic over the row type. */
export function useListShell<T>(items: T[], opts: ListShellOptions<T>): ListShell<T> {
  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState(opts.defaultSortId ?? opts.sorts[0]?.id ?? '');
  const [showAll, setShowAll] = useState(false);
  const pageSize = opts.pageSize ?? 25;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? items.filter((item) => opts.searchText(item).some((s) => s.toLowerCase().includes(q)))
      : items;
    const sort = opts.sorts.find((s) => s.id === sortId);
    return sort ? [...matched].sort(sort.compare) : matched;
    // searchText/sorts are stable per call site — items + query + sortId are
    // the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, sortId]);

  const visible = showAll ? filtered : filtered.slice(0, pageSize);

  return {
    query,
    setQuery,
    sortId,
    setSortId,
    showAll,
    setShowAll,
    visible,
    filtered,
    total: items.length,
  };
}
