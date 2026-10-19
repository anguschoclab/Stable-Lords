/**
 * Navigation trail — a small module-level ring buffer of visited pages
 * backing the breadcrumb's referrer chip. Recorded by
 * `useNavTrailRecorder` in AppShell (which persists across routes), read
 * by `Breadcrumbs` through useSyncExternalStore.
 */
interface TrailVisit {
  pathname: string;
  label: string;
}

const CAP = 10;

let visits: TrailVisit[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

/** Records a page visit; consecutive visits to the same path collapse. */
export function recordVisit(pathname: string, label: string): void {
  const last = visits[visits.length - 1];
  if (last?.pathname === pathname) {
    if (last.label !== label) {
      // Replace — never mutate in place, or the snapshot identity stays
      // stable and useSyncExternalStore subscribers miss the relabel.
      visits = [...visits.slice(0, -1), { pathname, label }];
      emit();
    }
    return;
  }
  visits = [...visits.slice(-(CAP - 1)), { pathname, label }];
  emit();
}

/** The most recent visit in `trail` that isn't the current page, if any. */
export function getReferrer(
  trail: readonly TrailVisit[],
  currentPathname: string
): TrailVisit | undefined {
  for (let i = trail.length - 1; i >= 0; i--) {
    const v = trail[i];
    if (v && v.pathname !== currentPathname) return v;
  }
  return undefined;
}

/** Snapshot for useSyncExternalStore — stable between emissions. */
export function getNavTrailSnapshot(): readonly TrailVisit[] {
  return visits;
}

/** Subscribes to trail changes; returns an unsubscribe. */
export function subscribeNavTrail(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Clears the trail — save loads, test cleanup, and full resets. */
export function resetNavTrail(): void {
  if (visits.length === 0) return;
  visits = [];
  emit();
}
