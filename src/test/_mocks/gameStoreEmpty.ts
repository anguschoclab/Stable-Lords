/** Shared stub for @/state/useGameStore — empty tournaments state + selector shim. */
export const useGameStore = (selector?: (s: Record<string, unknown>) => unknown) => {
  const state = { tournaments: [] };
  return selector ? selector(state) : state;
};
/** use World State. */
export const useWorldState = () => ({ tournaments: [], warriors: [], stables: [] });
/** use Warrior Name State. */
export const useWarriorNameState = () => 'Unknown';
