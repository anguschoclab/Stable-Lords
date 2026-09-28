/** Shared stub for @/state/useGameStore — empty tournaments state + selector shim. */
export const useGameStore = (selector?: (s: Record<string, unknown>) => unknown) => {
  const state = { tournaments: [] };
  return selector ? selector(state) : state;
};
export const useWorldState = () => ({ tournaments: [], warriors: [], stables: [] });
export const useWarriorNameState = () => 'Unknown';
