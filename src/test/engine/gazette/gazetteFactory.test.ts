import { describe, it, expect, vi } from 'vitest';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import type { CrowdMoodType } from '@/types/shared.types';

describe('generateWeeklyGazette', () => {
  it('generates a gazette for a valid mood', () => {
    const story = generateWeeklyGazette({
      fights: [],
      mood: 'Festive',
      week: 1,
      graveyard: [],
    });
    expect(story.mood).toBe('Festive');
    expect(story.headline.length).toBeGreaterThan(0);
    expect(story.body.length).toBeGreaterThan(0);
  });

  it('normalizes an unknown mood to the defined default on the story', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const story = generateWeeklyGazette({
      fights: [],
      mood: 'Neutral' as CrowdMoodType,
      week: 1,
      graveyard: [],
    });
    expect(story.mood).toBe('Calm');
    expect(story.headline.length).toBeGreaterThan(0);
    expect(story.body.length).toBeGreaterThan(0);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
