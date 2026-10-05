/**
 * Narrative Domain Impacts
 * Handles gazettes, scout reports, insight tokens, and last simulation report.
 */
import type {
  GameState,
  GazetteStory,
  ScoutReportData,
  InsightToken,
  SimulationReport,
} from '@/types/state.types';

/**
 * Apply gazettes to state.
 */
const gazettes = (state: GameState, value: GazetteStory[]) => {
  state.gazettes = value;
};

/**
 * Apply scout reports to state.
 */
const scoutReports = (state: GameState, value: ScoutReportData[]) => {
  state.scoutReports = [...(state.scoutReports || []), ...value];
};

/**
 * Apply insight tokens to state.
 */
const insightTokens = (state: GameState, value: InsightToken[]) => {
  state.insightTokens = [...(state.insightTokens || []), ...value];
};

/**
 * Apply last simulation report to state.
 */
const lastSimulationReport = (state: GameState, value: SimulationReport) => {
  state.lastSimulationReport = value;
};

/**
 * Narrative impact handlers map.
 */
export const narrativeHandlers = {
  gazettes,
  scoutReports,
  insightTokens,
  lastSimulationReport,
};
