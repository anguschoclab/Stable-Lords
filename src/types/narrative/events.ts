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
 * Defines the shape of the weekly random-event pool. Keyed by event id —
 * the pool grows as new events land in offseason.json's "events" section,
 * so the canonical type is a record rather than a fixed key list (the
 * previous interface drifted behind the data by several events).
 */
export type Events = Record<string, EventNarrative>;

// ─── Gazette Narratives ───────────────────────────────────────────────────
