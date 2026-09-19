import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoreArchive } from '@/lore/LoreArchive';
import type { FightSummary } from '@/types/game';

const KEY_FIGHTS = 'sl.lore.fights';
const KEY_HALL = 'sl.lore.hall';

const makeFight = (id: string, overrides: Partial<FightSummary> = {}): FightSummary =>
  ({
    id,
    week: 10,
    title: `Fight ${id}`,
    warriorIdA: 'wa1',
    warriorIdD: 'wa2',
    stableIdA: 'sa',
    stableIdD: 'sb',
    winner: 'A',
    by: 'KO',
    styleA: 'Lunging Attack',
    styleD: 'Total Parry',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }) as FightSummary;

const quotaError = () =>
  Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' });

describe('LoreArchive', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('allFights / allHall', () => {
    it('returns [] when storage is empty', () => {
      expect(LoreArchive.allFights()).toEqual([]);
      expect(LoreArchive.allHall()).toEqual([]);
    });

    it('returns [] when stored JSON is corrupted', () => {
      localStorage.setItem(KEY_FIGHTS, 'not-json{{{');
      localStorage.setItem(KEY_HALL, 'not-json{{{');
      expect(LoreArchive.allFights()).toEqual([]);
      expect(LoreArchive.allHall()).toEqual([]);
    });

    // Regression for latent bug: non-array JSON parses successfully, then
    // signalFight/markFightOfWeek crash on .push/.filter. loadArray must guard
    // with Array.isArray.
    it('returns [] when stored JSON is a non-array value and signalFight does not throw', () => {
      localStorage.setItem(KEY_FIGHTS, '{}');
      localStorage.setItem(KEY_HALL, 'null');
      expect(LoreArchive.allFights()).toEqual([]);
      expect(LoreArchive.allHall()).toEqual([]);
      expect(() => LoreArchive.signalFight(makeFight('f1'))).not.toThrow();
      expect(() => LoreArchive.markFightOfWeek(10, 'f1')).not.toThrow();
    });
  });

  describe('signalFight', () => {
    it('appends a fight and persists it', () => {
      const fight = makeFight('f1');
      LoreArchive.signalFight(fight);

      const fights = LoreArchive.allFights();
      expect(fights).toHaveLength(1);
      expect(fights[0]).toMatchObject({ id: 'f1', title: 'Fight f1' });
    });

    it('caps history at 500 entries, dropping the oldest', () => {
      const seeded = Array.from({ length: 500 }, (_, i) => makeFight(`old-${i}`));
      localStorage.setItem(KEY_FIGHTS, JSON.stringify(seeded));

      LoreArchive.signalFight(makeFight('new-fight'));

      const fights = LoreArchive.allFights();
      expect(fights).toHaveLength(500);
      expect(fights[0]!.id).toBe('old-1');
      expect(fights[499]!.id).toBe('new-fight');
    });

    it('strips transcripts from entries older than the last 20', () => {
      const seeded = Array.from({ length: 25 }, (_, i) =>
        makeFight(`t-${i}`, { transcript: ['clang!'] })
      );
      localStorage.setItem(KEY_FIGHTS, JSON.stringify(seeded));

      LoreArchive.signalFight(makeFight('latest', { transcript: ['new clang'] }));

      const fights = LoreArchive.allFights();
      expect(fights).toHaveLength(26);
      // arr.length - i > 20 → indices 0-5 stripped, 6-25 keep transcripts
      for (let i = 0; i < 6; i++) {
        expect(fights[i]!.transcript).toBeUndefined();
      }
      for (let i = 6; i < 26; i++) {
        expect(fights[i]!.transcript).toBeDefined();
      }
    });
  });

  describe('hall entries', () => {
    it('markFightOfWeek writes a Fight of the Week entry', () => {
      LoreArchive.markFightOfWeek(10, 'f1');

      expect(LoreArchive.allHall()).toEqual([
        {
          id: 'hall-10-Fight-of-the-Week',
          week: 10,
          label: 'Fight of the Week',
          fightId: 'f1',
        },
      ]);
    });

    it('dedupes Fight of the Week by label+week, keeping the latest', () => {
      LoreArchive.markFightOfWeek(10, 'f1');
      LoreArchive.markFightOfWeek(10, 'f2');

      const hall = LoreArchive.allHall();
      expect(hall).toHaveLength(1);
      expect(hall[0]!.fightId).toBe('f2');
    });

    it('markFightOfTournament writes a Fight of the Tournament entry that coexists with week entries', () => {
      LoreArchive.markFightOfWeek(10, 'f-week');
      LoreArchive.markFightOfTournament(10, 'f-tourney');

      const hall = LoreArchive.allHall();
      expect(hall).toHaveLength(2);
      expect(hall[1]).toEqual({
        id: 'hall-10-Fight-of-the-Tournament',
        week: 10,
        label: 'Fight of the Tournament',
        fightId: 'f-tourney',
      });
    });
  });

  describe('quota recovery (saveArray)', () => {
    it('trims to the last 100 existing entries when quota is exceeded', () => {
      const seeded = Array.from({ length: 150 }, (_, i) => makeFight(`old-${i}`));
      localStorage.setItem(KEY_FIGHTS, JSON.stringify(seeded));

      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      LoreArchive.signalFight(makeFight('new-fight'));

      // Recovery re-reads the OLD stored array (the new write failed) and
      // retries with its last 100 entries — the new fight is dropped.
      expect(setItemSpy).toHaveBeenCalledTimes(2);
      const retryArg = JSON.parse(setItemSpy.mock.calls[1]![1] as string);
      expect(retryArg).toHaveLength(100);
      expect(retryArg[0].id).toBe('old-50');
      expect(retryArg[99].id).toBe('old-149');
      expect(consoleSpy).toHaveBeenCalledWith(
        `localStorage quota exceeded when saving ${KEY_FIGHTS}`,
        expect.any(Error)
      );
    });

    it('does not retry when quota is exceeded with 100 or fewer existing entries', () => {
      const seeded = Array.from({ length: 50 }, (_, i) => makeFight(`old-${i}`));
      localStorage.setItem(KEY_FIGHTS, JSON.stringify(seeded));

      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      LoreArchive.signalFight(makeFight('new-fight'));

      expect(setItemSpy).toHaveBeenCalledTimes(1);
    });

    it('logs a generic error and does not retry for non-quota failures', () => {
      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw new Error('boom');
        });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => LoreArchive.signalFight(makeFight('f1'))).not.toThrow();

      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to save ${KEY_FIGHTS}`,
        expect.any(Error)
      );
    });
  });
});
