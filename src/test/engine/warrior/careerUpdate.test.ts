/**
 * Career Update Tests
 * Tests for warrior career progression, fatigue management, and tournament exemptions
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import {
  calculateCareerUpdate,
  applyCareerUpdate,
  updateWarriorAfterBout,
  updateWarriorFromBoutOutcome,
  CareerUpdateInput,
} from '@/engine/warrior/careerUpdate';
import { EPITHET_TABLES } from '@/data/names/epithets';

describe('careerUpdate', () => {
  const rng = new SeededRNGService(12345);

  function createTestWarrior(
    fatigue: number = 0,
    wins: number = 0,
    losses: number = 0,
    kills: number = 0,
    fame: number = 10
  ): Warrior {
    return makeWarrior(
      { id: undefined, name: 'TestWarrior', style: FightingStyle.StrikingAttack, attrs: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, overrides: {
        fatigue,
        career: { wins, losses, kills },
        fame,
        status: 'Active' as const,
      }, rng: rng }
    ) as Warrior;
  }

  describe('calculateCareerUpdate', () => {
    describe('fatigue management', () => {
      it('should add +25 fatigue for regular bout (skipFatigue=false)', () => {
        const warrior = createTestWarrior(10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(35); // 10 + 25
      });

      it('should NOT add fatigue when skipFatigue=true (tournament exemption)', () => {
        const warrior = createTestWarrior(30);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(30); // Unchanged
      });

      it('should cap fatigue at 100 for regular bout', () => {
        const warrior = createTestWarrior(90);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(100); // Capped, not 115
      });

      it('should reset fatigue to 0 when warrior is killed regardless of skipFatigue', () => {
        const warrior = createTestWarrior(50);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: true,
          isVictim: true,
          skipFatigue: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(0);
        expect(result.status).toBe('Dead');
      });

      it('should handle skipFatigue with already high fatigue', () => {
        const warrior = createTestWarrior(95);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          skipFatigue: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fatigue).toBe(95); // Unchanged despite being near cap
      });
    });

    describe('career stats', () => {
      it('should increment wins for winner', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(6);
        expect(result.career.losses).toBe(3);
        expect(result.career.kills).toBe(1);
      });

      it('should increment losses for loser', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(5);
        expect(result.career.losses).toBe(4);
        expect(result.career.kills).toBe(1);
      });

      it('should increment kills when winner gets a kill', () => {
        const warrior = createTestWarrior(0, 5, 3, 1);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: true,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.career.wins).toBe(6);
        expect(result.career.kills).toBe(2);
      });
    });

    describe('fame calculation', () => {
      it('should add +1 fame for regular win', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(11);
      });

      it('should add +3 fame for kill win', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: true,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(13);
      });

      it('should add fame delta bonus', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: true,
          isKill: false,
          isVictim: false,
          fameDelta: 5,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(16); // 10 + 1 (win) + 5 (delta)
      });

      it('should not add fame for loss', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 10);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(10);
      });

      it('should never have negative fame', () => {
        const warrior = createTestWarrior(0, 0, 0, 0, 0);
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
          fameDelta: -5,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.fame).toBe(0);
      });
    });

    describe('status management', () => {
      it('should keep status Active for survivor', () => {
        const warrior = createTestWarrior();
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: false,
          isVictim: false,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.status).toBe('Active');
      });

      it('should set status to Dead for victim', () => {
        const warrior = createTestWarrior();
        const input: CareerUpdateInput = {
          isWinner: false,
          isKill: true,
          isVictim: true,
        };

        const result = calculateCareerUpdate(warrior, input);

        expect(result.status).toBe('Dead');
      });
    });
  });

  describe('applyCareerUpdate', () => {
    it('should apply all updates to warrior', () => {
      const warrior = createTestWarrior(10, 5, 3, 1, 20);
      const updateResult = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
        skipFatigue: false,
      });

      const updated = applyCareerUpdate(warrior, updateResult);

      expect(updated.fatigue).toBe(35);
      expect(updated.career.wins).toBe(6);
      expect(updated.career.losses).toBe(3);
      expect(updated.fame).toBe(21);
      expect(updated.status).toBe('Active');
    });

    it('should preserve warrior id and name', () => {
      const warrior = createTestWarrior();
      const updateResult = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
      });

      const updated = applyCareerUpdate(warrior, updateResult);

      expect(updated.id).toBe(warrior.id);
      expect(updated.name).toBe(warrior.name);
    });
  });

  describe('updateWarriorAfterBout', () => {
    it('should correctly apply fame and popularity deltas along with win/kill outcomes', () => {
      const warrior = createTestWarrior(10, 5, 3, 1, 20);
      warrior.popularity = 50;
      const updated = updateWarriorAfterBout({ warrior: warrior, fameDelta: 5, popularityDelta: 10, isWinner: true, wasKilled: true, tags: [] });
      expect(updated.fame).toBe(28);
      expect(updated.popularity).toBe(60);
      expect(updated.career.wins).toBe(6);
      expect(updated.career.kills).toBe(2);
    });

    it('should apply "Flashy" flair to winner if "Flashy" tag is present', () => {
      const warrior = createTestWarrior();
      const updated = updateWarriorAfterBout({ warrior: warrior, fameDelta: 0, popularityDelta: 0, isWinner: true, wasKilled: false, tags: ['Flashy', 'OtherTag'] });
      expect(updated.flair).toContain('Flashy');
    });

    it('should not apply "Flashy" flair to loser even if "Flashy" tag is present', () => {
      const warrior = createTestWarrior();
      const updated = updateWarriorAfterBout({ warrior: warrior, fameDelta: 0, popularityDelta: 0, isWinner: false, wasKilled: false, tags: ['Flashy'] });
      expect(updated.flair === undefined || updated.flair.length === 0).toBe(true);
    });

    it('should preserve existing flair when adding "Flashy"', () => {
      const warrior = createTestWarrior();
      warrior.flair = ['Veteran'];
      const updated = updateWarriorAfterBout({ warrior: warrior, fameDelta: 0, popularityDelta: 0, isWinner: true, wasKilled: false, tags: ['Flashy'] });
      expect(updated.flair).toContain('Veteran');
      expect(updated.flair).toContain('Flashy');
      expect(updated.flair?.length).toBe(2);
    });

    it('should not duplicate "Flashy" flair if already present', () => {
      const warrior = createTestWarrior();
      warrior.flair = ['Flashy'];
      const updated = updateWarriorAfterBout({ warrior: warrior, fameDelta: 0, popularityDelta: 0, isWinner: true, wasKilled: false, tags: ['Flashy'] });
      expect(updated.flair).toContain('Flashy');
      expect(updated.flair?.length).toBe(1);
    });
  });

  describe('updateWarriorFromBoutOutcome', () => {
    it('should identify attacker as winner when winnerSide is A', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: false });

      expect(updated.career.wins).toBe(1);
      expect(updated.career.losses).toBe(0);
    });

    it('should identify attacker as loser when winnerSide is D', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'D', isKill: false, skipFatigue: false });

      expect(updated.career.wins).toBe(0);
      expect(updated.career.losses).toBe(1);
    });

    it('should identify defender as winner when winnerSide is D', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: false, winnerSide: 'D', isKill: false, skipFatigue: false });

      expect(updated.career.wins).toBe(1);
      expect(updated.career.losses).toBe(0);
    });

    it('should apply fatigue skip for tournament bout', () => {
      const warrior = createTestWarrior(40);

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: true });

      expect(updated.fatigue).toBe(40); // Unchanged
      expect(updated.career.wins).toBe(1);
    });

    it('should apply normal fatigue for non-tournament bout', () => {
      const warrior = createTestWarrior(40);

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: false });

      expect(updated.fatigue).toBe(65); // 40 + 25
    });

    it('should handle kill victory with fatigue skip', () => {
      const warrior = createTestWarrior(30, 5, 2, 1, 15);

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: true, skipFatigue: true });

      expect(updated.fatigue).toBe(30); // Unchanged
      expect(updated.career.wins).toBe(6);
      expect(updated.career.kills).toBe(2);
      expect(updated.fame).toBe(18); // +3 for kill
    });

    it('should handle death outcome (isVictim)', () => {
      const warrior = createTestWarrior(50, 3, 2, 0, 10);

      // Defender loses and gets killed
      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: false, winnerSide: 'A', isKill: true, skipFatigue: false });

      expect(updated.status).toBe('Dead');
      expect(updated.fatigue).toBe(0);
      expect(updated.career.losses).toBe(3);
    });
  });

  describe('byArena career preservation', () => {
    it('preserves career.byArena and medals when no arenaId is provided', () => {
      const warrior = createTestWarrior(0, 5, 3, 1);
      warrior.career = {
        ...warrior.career,
        byArena: { arena_x: { wins: 4, losses: 2, kills: 1 } },
        medals: { gold: 1, silver: 0, bronze: 2 },
      };

      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
      });

      expect(result.career.wins).toBe(6);
      expect(result.career.byArena).toEqual({ arena_x: { wins: 4, losses: 2, kills: 1 } });
      expect(result.career.medals).toEqual({ gold: 1, silver: 0, bronze: 2 });
    });

    it('records a win into byArena[arenaId] when arenaId is provided', () => {
      const warrior = createTestWarrior(0, 5, 3, 1);
      warrior.career = {
        ...warrior.career,
        byArena: { arena_x: { wins: 4, losses: 2, kills: 1 } },
      };

      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
        arenaId: 'arena_x',
      });

      expect(result.career.byArena?.arena_x).toEqual({ wins: 5, losses: 2, kills: 1 });
    });

    it('records a loss into byArena[arenaId] when arenaId is provided', () => {
      const warrior = createTestWarrior(0, 5, 3, 1);
      warrior.career = {
        ...warrior.career,
        byArena: { arena_x: { wins: 4, losses: 2, kills: 1 } },
      };

      const result = calculateCareerUpdate(warrior, {
        isWinner: false,
        isKill: true,
        isVictim: true,
        arenaId: 'arena_x',
      });

      expect(result.career.byArena?.arena_x).toEqual({ wins: 4, losses: 3, kills: 1 });
    });

    it('credits the kill to the winner arena record only', () => {
      const winner = createTestWarrior(0, 5, 3, 1);
      const loser = createTestWarrior(0, 2, 4, 0);

      const winnerResult = calculateCareerUpdate(winner, {
        isWinner: true,
        isKill: true,
        isVictim: false,
        arenaId: 'arena_x',
      });
      const loserResult = calculateCareerUpdate(loser, {
        isWinner: false,
        isKill: true,
        isVictim: true,
        arenaId: 'arena_x',
      });

      expect(winnerResult.career.byArena?.arena_x).toEqual({ wins: 1, losses: 0, kills: 1 });
      expect(loserResult.career.byArena?.arena_x).toEqual({ wins: 0, losses: 1, kills: 0 });
    });

    it('preserves byArena entries for unrelated arenas when recording a bout', () => {
      const warrior = createTestWarrior(0, 5, 3, 1);
      warrior.career = {
        ...warrior.career,
        byArena: {
          arena_x: { wins: 4, losses: 2, kills: 1 },
          arena_y: { wins: 9, losses: 9, kills: 9 },
        },
      };

      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
        arenaId: 'arena_x',
      });

      expect(result.career.byArena?.arena_y).toEqual({ wins: 9, losses: 9, kills: 9 });
    });

    it('updateWarriorFromBoutOutcome threads arenaId into byArena', () => {
      const warrior = createTestWarrior();

      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: false, arenaId: 'arena_x' });

      expect(updated.career.byArena?.arena_x).toEqual({ wins: 1, losses: 0, kills: 0 });
    });
  });

  describe('seasonPoints', () => {
    it('should accrue +2 season points for a regular win', () => {
      const warrior = createTestWarrior();
      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: false });
      expect(updated.seasonPoints).toBe(2);
    });

    it('should accrue +5 season points for a kill win', () => {
      const warrior = createTestWarrior();
      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: true, skipFatigue: false });
      expect(updated.seasonPoints).toBe(5);
    });

    it('should accrue 0 season points for a loss', () => {
      const warrior = createTestWarrior();
      const updated = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'D', isKill: false, skipFatigue: false });
      expect(updated.seasonPoints ?? 0).toBe(0);
    });

    it('should accumulate across bouts', () => {
      let warrior = createTestWarrior();
      warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: false });
      warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: true, skipFatigue: false });
      expect(warrior.seasonPoints).toBe(7); // 2 + 5
    });
  });

  describe('tournament week fatigue exemption integration', () => {
    it('should simulate tournament week with multiple bouts - fatigue should not accumulate', () => {
      let warrior = createTestWarrior(10);
      const skipFatigue = true; // Tournament week

      // Simulate 3 tournament bouts in one week
      for (let i = 0; i < 3; i++) {
        warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: skipFatigue });
      }

      // After 3 wins with fatigue skip, should still be at initial fatigue
      expect(warrior.fatigue).toBe(10);
      expect(warrior.career.wins).toBe(3);
    });

    it('should simulate regular week with multiple bouts - fatigue should accumulate', () => {
      let warrior = createTestWarrior(10);
      const skipFatigue = false; // Regular week

      // Simulate 3 regular bouts
      for (let i = 0; i < 3; i++) {
        warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: skipFatigue });
      }

      // After 3 wins: 10 + 25 + 25 + 25 = 85
      expect(warrior.fatigue).toBe(85);
      expect(warrior.career.wins).toBe(3);
    });

    it('should cap fatigue at 100 even with multiple bouts', () => {
      let warrior = createTestWarrior(80);
      const skipFatigue = false;

      // Two more bouts should cap at 100, not 130
      warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: skipFatigue });
      warrior = updateWarriorFromBoutOutcome({ warrior: warrior, isAttacker: true, winnerSide: 'A', isKill: false, skipFatigue: skipFatigue });

      expect(warrior.fatigue).toBe(100);
    });
  });

  describe('milestone epithets', () => {
    it('awards a kill epithet when kills cross a threshold', () => {
      const warrior = createTestWarrior(0, 5, 5, 2); // 2 kills
      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: true,
        isVictim: false,
      });
      expect(result.career.kills).toBe(3);
      expect(result.epithet).toBeDefined();
      expect(EPITHET_TABLES.kill_3).toContain(result.epithet);
    });

    it('applies the epithet through applyCareerUpdate', () => {
      const warrior = createTestWarrior(0, 5, 5, 4);
      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: true,
        isVictim: false,
      });
      const updated = applyCareerUpdate(warrior, result);
      expect(updated.epithet).toBe(result.epithet);
      expect(EPITHET_TABLES.kill_5).toContain(updated.epithet);
      expect(updated.name).toBe('TestWarrior'); // name never mutates
    });

    it('does not award an epithet below thresholds', () => {
      const warrior = createTestWarrior(0, 5, 5, 0);
      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: false,
        isVictim: false,
      });
      expect(result.epithet).toBeUndefined();
    });

    it('never downgrades an existing champion epithet', () => {
      const warrior = createTestWarrior(0, 5, 5, 2);
      warrior.epithet = EPITHET_TABLES.arena_champion[0]!;
      const result = calculateCareerUpdate(warrior, {
        isWinner: true,
        isKill: true,
        isVictim: false,
      });
      expect(result.epithet).toBeUndefined(); // no downgrade emitted
    });

    it('does not award milestone epithets to a dead victim', () => {
      const warrior = createTestWarrior(0, 10, 5, 9);
      const result = calculateCareerUpdate(warrior, {
        isWinner: false,
        isKill: true,
        isVictim: true,
      });
      expect(result.status).toBe('Dead');
      expect(result.epithet).toBeUndefined();
    });
  });
});
