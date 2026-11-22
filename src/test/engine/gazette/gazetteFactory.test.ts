import { describe, it, expect, vi } from 'vitest';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import type { FightSummary } from '@/types/combat.types';
import type { CrowdMoodType, FightId, WarriorId } from '@/types/shared.types';

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

describe('generateWeeklyGazette — title bouts', () => {
  let fightId = 0;
  const createFight = (overrides: Partial<FightSummary> = {}): FightSummary => ({
    id: `tf-${fightId++}` as FightId,
    week: 6,
    title: 'Champ vs Challenger',
    warriorIdA: 'w-champ' as WarriorId,
    warriorIdD: 'w-challenger' as WarriorId,
    winner: 'A',
    by: 'Decision',
    styleA: 'Brawler',
    styleD: 'Swordsman',
    createdAt: new Date().toISOString(),
    fameA: 50,
    fameD: 50,
    ...overrides,
  });

  it('headlines a decided title bout and tags the story Title Bout', () => {
    const story = generateWeeklyGazette({
      fights: [createFight({ titleArenaId: 'arena-1' })],
      mood: 'Festive',
      week: 6,
      graveyard: [],
      allFights: undefined,
    });
    expect(story.tags).toContain('Title Bout');
    // Every TitleBout headline template names the winner.
    expect(story.headline).toContain('Champ');
  });

  it('gives the title bout top billing over a hot streak', () => {
    // Streaker has won 4 straight entering the week; a 5th win would
    // ordinarily earn the streak headline — the championship outranks it.
    const prior = [1, 2, 3, 4].map((w) =>
      createFight({
        week: w,
        title: `Streaker vs Jobber${w}`,
        warriorIdA: 'w-streaker' as WarriorId,
        warriorIdD: `w-jobber${w}` as WarriorId,
        winner: 'A',
      })
    );
    const weekFights = [
      createFight({ titleArenaId: 'arena-1' }),
      createFight({
        title: 'Streaker vs Jobber5',
        warriorIdA: 'w-streaker' as WarriorId,
        warriorIdD: 'w-jobber5' as WarriorId,
        winner: 'A',
      }),
    ];
    const story = generateWeeklyGazette({
      fights: weekFights,
      mood: 'Calm',
      week: 6,
      graveyard: [],
      allFights: [...prior, ...weekFights],
    });
    expect(story.headline).toContain('Champ');
    expect(story.headline).not.toContain('Streaker');
  });

  it('falls through to the standard chain when a title bout is drawn', () => {
    const story = generateWeeklyGazette({
      fights: [createFight({ titleArenaId: 'arena-1', winner: null, by: 'Exhaustion' })],
      mood: 'Calm',
      week: 6,
      graveyard: [],
    });
    // Still tagged — the title bout happened — but no championship headline.
    expect(story.tags).toContain('Title Bout');
    expect(story.headline).not.toContain('Champ');
    expect(story.headline).not.toContain('{{');
  });
});
