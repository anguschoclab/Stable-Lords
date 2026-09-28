/**
 * Stable Lords — Arena Championship Engine
 *
 * Pure per-week title bookkeeping, consumed by ArenaChampionshipPass.
 * Every mutating function accumulates its writes into a ChampionshipDelta —
 * nothing touches GameState directly, so the pass converts the delta into a
 * StateImpact and the pipeline merge order stays deterministic.
 *
 * Pass-internal order (tested): vacancies → result resolution → refusal sweep
 * → lifecycle transitions → scheduling → perks.
 */
export * from './core';
export * from './queries';
export * from './phases/seeding';
export * from './phases/vacancies';
export * from './phases/results';
export * from './phases/refusals';
export * from './phases/lifecycle';
export * from './phases/scheduling';
export * from './phases/perks';
export * from './phases/relinquish';
