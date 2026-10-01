/** Branded ID pattern to prevent mixing different ID types at compile time. */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

/**
 * Warrior id type.
 */
export type WarriorId = Brand<string, 'WarriorId'>;

/**
 * Stable id type.
 */
export type StableId = Brand<string, 'StableId'>;

/**
 * Promoter id type.
 */
export type PromoterId = Brand<string, 'PromoterId'>;

/**
 * Trainer id type.
 */
export type TrainerId = Brand<string, 'TrainerId'>;

/**
 * Fight id type.
 */
export type FightId = Brand<string, 'FightId'>;

/**
 * Tournament id type.
 */
export type TournamentId = Brand<string, 'TournamentId'>;

/**
 * Bout offer id type.
 */
export type BoutOfferId = Brand<string, 'BoutOfferId'>;

/**
 * Injury id type.
 */
export type InjuryId = Brand<string, 'InjuryId'>;

/**
 * Ledger entry id type.
 */
export type LedgerEntryId = Brand<string, 'LedgerEntryId'>;

/**
 * Scout report id type.
 */
export type ScoutReportId = Brand<string, 'ScoutReportId'>;

/**
 * News id type.
 */
export type NewsId = Brand<string, 'NewsId'>;

/**
 * Grudge id type.
 */
export type GrudgeId = Brand<string, 'GrudgeId'>;

/**
 * Rivalry id type.
 */
export type RivalryId = Brand<string, 'RivalryId'>;

/**
 * Insight id type.
 */
export type InsightId = Brand<string, 'InsightId'>;

/**
 * Hall entry id type.
 */
export type HallEntryId = Brand<string, 'HallEntryId'>;

/**
 * Simulation report id type.
 */
export type SimulationReportId = Brand<string, 'SimulationReportId'>;
