import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatronTokenService } from '@/engine/tokens/patronTokenService';
import type { GameState, InsightTokenType } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

describe('PatronTokenService', () => {
  let mockState: GameState;
  let mockRng: IRNGService;

  beforeEach(() => {
    mockState = {
      week: 10,
      insightTokens: [],
      newsletter: [],
      roster: [],
    } as unknown as GameState;

    mockRng = {
      uuid: vi.fn(() => 'mock-uuid'),
      pick: vi.fn((arr) => arr[0]),
    } as unknown as IRNGService;
  });

  describe('awardToken', () => {
    it('should award a new token to the state and add a newsletter item', () => {
      const result = PatronTokenService.awardToken(mockState, 'Weapon', 'Grand Tournament', mockRng);

      expect(result.insightTokens?.length).toBe(1);
      expect(result.insightTokens?.[0]).toEqual({
        id: 'mock-uuid',
        type: 'Weapon',
        warriorId: '',
        warriorName: 'Unassigned',
        detail: 'Awarded from Grand Tournament',
        discoveredWeek: 10,
      });

      expect(result.newsletter?.length).toBe(1);
      expect(result.newsletter?.[0].title).toBe('Patronage Awarded');
      expect(result.newsletter?.[0].items[0]).toContain('Weapon');
      expect(result.newsletter?.[0].items[0]).toContain('Grand Tournament');
      expect(mockRng.uuid).toHaveBeenCalledTimes(2); // Once for token, once for newsletter
    });

    it('should handle undefined insightTokens and newsletter arrays', () => {
      const emptyState = { week: 5 } as GameState;
      const result = PatronTokenService.awardToken(emptyState, 'Style', 'Local Arena');

      expect(result.insightTokens?.length).toBe(1);
      expect(result.insightTokens?.[0].type).toBe('Style');
      expect(result.newsletter?.length).toBe(1);
    });
  });

  describe('assignToken', () => {
    let warrior: Warrior;

    beforeEach(() => {
      warrior = {
        id: 'w-1',
        name: 'Gronk',
        attributes: { ST: 10, WT: 10, SP: 10, DF: 10, EX: 10, CH: 10 },
        favorites: {
          discovered: { weapon: false, rhythm: false, style: false, tactic: false },
        },
        baseSkills: { ATT: 5, DEF: 5 },
        flair: [],
      } as unknown as Warrior;

      mockState.roster = [warrior];
      mockState.insightTokens = [
        { id: 't-weapon', type: 'Weapon' as InsightTokenType } as any,
        { id: 't-rhythm', type: 'Rhythm' as InsightTokenType } as any,
        { id: 't-attr', type: 'Attribute' as InsightTokenType } as any,
        { id: 't-style', type: 'Style' as InsightTokenType } as any,
        { id: 't-tactic', type: 'Tactic' as InsightTokenType } as any,
      ];
    });

    it('should return original state if token is not found', () => {
      const result = PatronTokenService.assignToken(mockState, 't-missing', 'w-1');
      expect(result).toBe(mockState);
    });

    it('should return original state if warrior is not found', () => {
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-missing');
      expect(result).toBe(mockState);
    });

    it('should assign a Weapon token, updating favorites and removing token', () => {
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.favorites?.discovered.weapon).toBe(true);
      expect(result.insightTokens?.find(t => t.id === 't-weapon')).toBeUndefined();
      expect(result.newsletter?.[0].title).toBe('Patronage Internalized');
    });

    it('should assign a Rhythm token, updating favorites', () => {
      const result = PatronTokenService.assignToken(mockState, 't-rhythm', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.favorites?.discovered.rhythm).toBe(true);
    });

    it('should assign an Attribute token, increasing an attribute using RNG', () => {
      mockRng.pick = vi.fn().mockReturnValue('ST');
      const result = PatronTokenService.assignToken(mockState, 't-attr', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.attributes.ST).toBe(11);
      expect(mockRng.pick).toHaveBeenCalledWith(['ST', 'WT', 'SP', 'DF']);
    });

    it('should assign an Attribute token even if attributes object is sparse or missing', () => {
      warrior.attributes = {} as any; // Empty attributes
      const result = PatronTokenService.assignToken(mockState, 't-attr', 'w-1');

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.attributes.ST).toBe(11); // Defaults to 10 + 1
    });

    it('should assign a Style token, increasing ATT base skill', () => {
      const result = PatronTokenService.assignToken(mockState, 't-style', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.baseSkills?.ATT).toBe(6);
    });

    it('should assign a Tactic token, adding Tactical Insight to flair', () => {
      const result = PatronTokenService.assignToken(mockState, 't-tactic', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.flair).toContain('Tactical Insight');
    });

    it('should handle assigning tokens to warrior with no flair array defined', () => {
      delete warrior.flair;
      const result = PatronTokenService.assignToken(mockState, 't-tactic', 'w-1', mockRng);

      const updatedWarrior = result.roster.find(w => w.id === 'w-1');
      expect(updatedWarrior?.flair).toEqual(['Tactical Insight']);
    });

    it('should not throw if warrior favorites or baseSkills are undefined', () => {
      delete warrior.favorites;
      delete warrior.baseSkills;

      // Should not crash, just returns unmodified warrior (except for token removal)
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1', mockRng);
      const updatedWarrior = result.roster.find(w => w.id === 'w-1');

      expect(updatedWarrior?.favorites).toBeUndefined();
      expect(result.insightTokens?.length).toBe(4); // Token still consumed
    });

    it('should handle undefined newsletter array in assignToken', () => {
      delete mockState.newsletter;
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1');
      expect(result.newsletter?.length).toBe(1);
      expect(result.newsletter?.[0].title).toBe('Patronage Internalized');
    });
  });
});
