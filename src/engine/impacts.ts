import { GameState, Warrior, LedgerEntry } from "@/types/game";
import { updateEntityInList } from "@/utils/stateUtils";

export interface StateImpact { goldDelta?: number; fameDelta?: number; rosterUpdates?: Map<string, Partial<Warrior>>; newsletterItems?: { week: number; title: string; items: string[] }[]; ledgerEntries?: LedgerEntry[]; newPoolRecruits?: any[]; }

type ImpactHandler = (state: GameState, value: any) => void;

const impactHandlers: Record<keyof StateImpact, ImpactHandler> = {
  goldDelta: (state, value: number) => { state.gold = (state.gold ?? 0) + value; },
  fameDelta: (state, value: number) => { state.fame = (state.fame ?? 0) + value; },
  rosterUpdates: (state, value: Map<string, Partial<Warrior>>) => {
    value.forEach((update, id) => { state.roster = updateEntityInList(state.roster, id, (w) => ({ ...w, ...update })); });
  },
  newsletterItems: (state, value: any[]) => { state.newsletter = [...state.newsletter, ...value]; },
  ledgerEntries: (state, value: any[]) => { state.ledger = [...(state.ledger ?? []), ...value]; },
  newPoolRecruits: () => { }
};

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    for (const key of Object.keys(impact) as Array<keyof StateImpact>) {
      if (impact[key] !== undefined && impactHandlers[key]) impactHandlers[key](newState, impact[key]);
    }
  }
  return newState;
}

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = { goldDelta: 0, fameDelta: 0, rosterUpdates: new Map(), newsletterItems: [], ledgerEntries: [] };
  for (const imp of impacts) {
    if (imp.goldDelta) merged.goldDelta! += imp.goldDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => { const existing = merged.rosterUpdates!.get(key) || {}; merged.rosterUpdates!.set(key, { ...existing, ...val }); });
    }
    if (imp.newsletterItems) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries) merged.ledgerEntries!.push(...imp.ledgerEntries);
  }
  return merged;
}
