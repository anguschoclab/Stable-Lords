/**
 * Phase Resolvers — Re-export barrel.
 * Logic split into initiativePhase.ts and offenseDefense.ts for SRP separation.
 */
export { resolveInitiativePhase } from './initiativePhase';
export {
  type OffenseDefenseCtx,
  resolveWhiffRiposte,
  resolveContestedDefense,
  resolveCombatOffenseDefense,
} from './offenseDefense';
