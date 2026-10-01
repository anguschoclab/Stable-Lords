/**
 * Season type.
 */
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

/**
 * Crowd mood type type.
 */
export type CrowdMoodType = 'Calm' | 'Bloodthirsty' | 'Theatrical' | 'Solemn' | 'Festive';

/**
 * Defines the shape of newsletter item.
 */
export interface NewsletterItem {
  id: string; // Could be branded but loosely used in many places for now
  week: number;
  title: string;
  items: string[];
  category?: 'event' | 'news' | 'newsletter';
}
