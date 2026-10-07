/**
 * Zero-valued SimPulse metric fields shared by metrics tests.
 * Spread into pulse/cumulative builders wherever a neutral metrics baseline
 * is needed — the field set must stay in sync with SimPulse's metric keys.
 */

/** Trait-aggregate metric fields at zero. */
export const ZERO_TRAIT_FIELDS = {
  traitedWarriors: 0,
  totalTraits: 0,
  flawInstances: 0,
  multiFlawWarriors: 0,
  classTraitInstances: 0,
  signatureInstances: 0,
} as const;

/** AI/season metric fields at zero. */
export const ZERO_AI_FIELDS = {
  intentDistribution: {},
  playerChallengedWeeks: 0,
  vendettaCount: 0,
  avgDossierCoverage: 0,
  counterOfferRate: 0,
  offerCount: 0,
  counteredOfferCount: 0,
  aiCrownsHeld: 0,
  playerCrownsHeld: 0,
  liveTitleOffers: 0,
  reignEndings: {},
  grandChampionsCount: 0,
  crownCampaignsActive: 0,
  titleOfferStatuses: {},
  avgPlanIntelStaleness: 0,
  maskedScoutReports: 0,
  grandChampFieldSize: 0,
  grandChampCancellations: 0,
  avgChampionFatigue: 0,
  cornerAdviceEvents: 0,
  competenceDistribution: {},
} as const;
