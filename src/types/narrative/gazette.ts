
/**
 * Defines the shape of gazette fights.
 */
export interface GazetteFights {
  Kill: string[];
  KO: string[];
  Stoppage: string[];
  Exhaustion: string[];
  Draw: string[];
  Default: string[];
}


/**
 * Defines the shape of gazette headlines.
 */
export interface GazetteHeadlines {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  win_streak?: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  major_upset?: string[];
  MultipleKills: string[];
  Kill: string[];
  MultipleKOs: string[];
  Standard: string[];
  Empty: string[];
  Graveyard: string[];
}


/**
 * Defines the shape of gazette featured.
 */
export interface GazetteFeatured {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  Graveyard: string[];
}


/**
 * Defines the shape of season summary.
 */
export interface SeasonSummary {
  headline: string;
  body: string[];
}


/**
 * Defines the shape of gazette narratives.
 */
export interface GazetteNarratives {
  fights: GazetteFights;
  headlines: GazetteHeadlines;
  featured: GazetteFeatured;
  season_summary: SeasonSummary;
}

// ─── Fanfare ─────────────────────────────────────────────────────────────
