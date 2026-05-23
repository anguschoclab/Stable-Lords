/**
 * AI Fight Plan Generation
 * Re-exports from modular AI plan system for backward compatibility.
 * Original 463-line file split into focused modules:
 * - coreGenerator.ts: Main orchestration
 * - matchup/styleMatcher.ts: Style matchup heuristics
 * - tacticAdvisor.ts: Tactic selection
 * - phasePlanner.ts: Phase strategies
 * - personalityEngine.ts: Personality adaptations
 * - strategyValidator.ts: Score validation
 */
export {
  aiPlanForWarrior,
  getStyleMatchupMods,
  getStyleSuitabilityBias,
  getBestOffensiveTactic,
  getBestDefensiveTactic,
  buildPhasePlan,
  buildDesperatePlan,
  buildUniversalConditions,
  getPersonalityAdaptations,
  PERSONALITY_ADAPTATION_MAP,
  validateAndAdjustPlan,
} from './ai/plan';
