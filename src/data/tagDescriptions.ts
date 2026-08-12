/**
 * Stable Lords — Tag/Badge Tooltip Descriptions
 * Describes the gameplay impact of flair, titles, injuries, and status tags.
 * Decoupled from hardcoded strings and migrated to narrative domain files.
 */
import uiMeta from '@/data/narrative/uiMeta.json';

const meta = (uiMeta as any).meta;

/**
 * Flair_descriptions.
 */
export const FLAIR_DESCRIPTIONS: Record<string, string> = meta.flair;

/**
 * Title_descriptions.
 */
export const TITLE_DESCRIPTIONS: Record<string, string> = meta.title;

/**
 * Injury_descriptions.
 */
export const INJURY_DESCRIPTIONS: Record<string, string> = meta.injury;

/**
 * Status_descriptions.
 */
export const STATUS_DESCRIPTIONS: Record<string, string> = meta.status;

/**
 * Get a tooltip description for any warrior tag.
 * Falls back to a generic message if the tag isn't specifically documented.
 */
export function getTagDescription(tag: string): string {
  return (
    FLAIR_DESCRIPTIONS[tag] ??
    TITLE_DESCRIPTIONS[tag] ??
    INJURY_DESCRIPTIONS[tag] ??
    STATUS_DESCRIPTIONS[tag] ??
    `${tag} — a notable trait earned through arena combat.`
  );
}
