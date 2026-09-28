
/**
 * Defines the shape of event narrative.
 */
export interface EventNarrative {
  title: string;
  newsletter: string[];
  injury_name?: string;
  injury_desc?: string;
}


/**
 * Defines the shape of events.
 */
export interface Events {
  tavern_brawl: EventNarrative;
  celestial_blessing: EventNarrative;
}

// ─── Gazette Narratives ───────────────────────────────────────────────────
