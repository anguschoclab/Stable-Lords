import { create } from 'zustand';

/**
 * Per-route primary CTA registry — DESIGN_PAGE_SYSTEM_v1.0 §1.
 * The top-bar CTA swaps by route context; detail and lore routes get none.
 *
 * Two action shapes:
 *  - `advance` — runs the week/day advance pipeline (the real mechanism by which
 *    bouts resolve, regimens commit, and the season closes).
 *  - `page`    — the page registers a concrete handler via useRegisterCtaAction
 *    (e.g. Tournaments registers bracket resolution, ArenaHub registers
 *    scroll-to-card, Recruit registers sign-the-selection).
 *  - `navigate` — honest cross-route CTA (Scouting's "sign" sends you to the
 *    contract market).
 */
export interface PrimaryCtaDef {
  label: string;
  intent: 'advance' | 'page' | 'navigate';
  /** Navigation target for `navigate` intent. */
  to?: string;
}

export const PRIMARY_CTA_BY_ROUTE: Record<string, PrimaryCtaDef> = {
  '/': { label: 'EXECUTE WEEK', intent: 'advance' },
  '/stable/bouts': { label: 'BEGIN CYCLE', intent: 'advance' },
  '/stable/arena': { label: 'VIEW CARD', intent: 'page' },
  '/world/tournaments': { label: 'ADVANCE BRACKET', intent: 'page' },
  '/stable/training': { label: 'COMMIT REGIMEN', intent: 'advance' },
  '/stable/planner': { label: 'COMMIT REGIMEN', intent: 'advance' },
  '/stable/recruit': { label: 'SIGN CONTRACT', intent: 'page' },
  '/world/scouting': { label: 'SIGN CONTRACT', intent: 'navigate', to: '/stable/recruit' },
  '/stable/offseason': { label: 'CLOSE SEASON', intent: 'advance' },
};

/**
 * Resolves the primary CTA for a pathname. Exact match wins; otherwise the
 * longest registered prefix. Detail (`/warrior/x`, `/world/stable/x`) and lore
 * routes resolve to null — no primary CTA there per spec.
 */
export function resolvePrimaryCta(pathname: string): PrimaryCtaDef | null {
  const exact = PRIMARY_CTA_BY_ROUTE[pathname];
  if (exact) return exact;
  let best: string | null = null;
  for (const key of Object.keys(PRIMARY_CTA_BY_ROUTE)) {
    if (key === '/') continue;
    if (pathname.startsWith(`${key}/`) && (!best || key.length > best.length)) best = key;
  }
  return best ? (PRIMARY_CTA_BY_ROUTE[best] ?? null) : null;
}

/** A live page-registered handler for a `page`-intent CTA. */
export interface CtaAction {
  enabled: boolean;
  run: () => void | Promise<void>;
}

interface CtaRegistryState {
  actions: Record<string, CtaAction | undefined>;
  register: (routeKey: string, action: CtaAction) => void;
  unregister: (routeKey: string) => void;
}

/** Registry of live page-provided CTA actions, keyed by registry route key. */
export const useCtaRegistry = create<CtaRegistryState>((set) => ({
  actions: {},
  register: (routeKey, action) =>
    set((s) => ({ actions: { ...s.actions, [routeKey]: action } })),
  unregister: (routeKey) =>
    set((s) => ({ actions: { ...s.actions, [routeKey]: undefined } })),
}));

/** Resolves the registry route key for a pathname (used for action lookup). */
export function resolvePrimaryCtaKey(pathname: string): string | null {
  if (pathname in PRIMARY_CTA_BY_ROUTE) return pathname;
  let best: string | null = null;
  for (const key of Object.keys(PRIMARY_CTA_BY_ROUTE)) {
    if (key === '/') continue;
    if (pathname.startsWith(`${key}/`) && (!best || key.length > best.length)) best = key;
  }
  return best;
}
