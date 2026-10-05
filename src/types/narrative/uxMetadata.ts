import type { CrowdMoodType } from '../shared.types';

/**
 * Defines the shape of mood tone record.
 */
interface MoodToneRecord {
  adjectives: string[];
  opener: string[];
  closer: string[];
}

/**
 * Defines the shape of ux metadata.
 */
export interface UxMetadata {
  version: string;
  description: string;
  mood_tone: Record<CrowdMoodType, MoodToneRecord>;
}

// ─── Persona Descriptors ─────────────────────────────────────────────────
