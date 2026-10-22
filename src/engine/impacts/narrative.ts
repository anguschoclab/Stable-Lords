/**
 * Narrative Domain Impacts
 * Handles gazettes, scout reports, insight tokens, and the steward report.
 */
import type {
  GameState,
  GazetteStory,
  ScoutReportData,
  InsightToken,
  StewardReport,
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
 * Apply the steward report to state.
 */
const stewardReport = (state: GameState, value: StewardReport) => {
  state.stewardReport = value;
};

/**
 * Narrative impact handlers map.
 */
export const narrativeHandlers = {
  gazettes,
  scoutReports,
  insightTokens,
  stewardReport,
};
