import { vi } from 'vitest';
import type { GameState } from '@/types/state.types';

/**
 * Shared stub for @/engine/core/warriorLookup — scans roster, then rival
 * rosters, then tournament participant snapshots. Participant snapshots are
 * intentionally last (live rosters win over stale selection-time copies).
 */
export const findWarriorById = vi.fn((state: GameState, id: string) => {
  for (const w of state.roster) if (w.id === id) return w;
  for (const r of state.rivals || []) for (const w of r.roster) if (w.id === id) return w;
  for (const t of state.tournaments || [])
    for (const p of t.participants || []) if (p.id === id) return p;
  return undefined;
});
