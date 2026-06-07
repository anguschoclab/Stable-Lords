import { describe, it, expect } from 'vitest';
import { stripNonSerializable, clearReconstructionCache } from '@/state/serialization';
import { SaveSlotMetaSchema } from '@/schemas/gameStateSchema';

describe('gameStoreSecurity', () => {
  describe('stripNonSerializable', () => {
    it('removes warriorMap from state', () => {
      const state = { warriorMap: new Map(), other: 'value' } as any;
      const result = stripNonSerializable(state);
      expect(result).not.toHaveProperty('warriorMap');
      expect(result).toHaveProperty('other', 'value');
    });

    it('removes rivalMap from state', () => {
      const state = { rivalMap: new Map(), data: 123 } as any;
      const result = stripNonSerializable(state);
      expect(result).not.toHaveProperty('rivalMap');
      expect(result).toHaveProperty('data', 123);
    });

    it('removes cachedMetaDrift from state', () => {
      const state = { cachedMetaDrift: {}, kept: true } as any;
      const result = stripNonSerializable(state);
      expect(result).not.toHaveProperty('cachedMetaDrift');
      expect(result).toHaveProperty('kept', true);
    });

    it('removes warriorToStableMap from state', () => {
      const state = { warriorToStableMap: new Map(), kept: true } as any;
      const result = stripNonSerializable(state);
      expect(result).not.toHaveProperty('warriorToStableMap');
      expect(result).toHaveProperty('kept', true);
    });

    it('preserves other fields', () => {
      const state = {
        warriorMap: new Map(),
        rivalMap: new Map(),
        treasury: 1000,
        week: 5,
        roster: [],
      } as any;
      const result = stripNonSerializable(state);
      expect(result).toHaveProperty('treasury', 1000);
      expect(result).toHaveProperty('week', 5);
      expect(result).toHaveProperty('roster');
    });
  });

  describe('SaveSlotMetaSchema validation', () => {
    it('accepts valid save slot metadata', () => {
      const valid = [
        {
          id: '1',
          name: 'Save 1',
          week: 1,
          year: 1,
          timestamp: '2024-01-01T00:00:00Z',
          version: '1.0',
        },
      ];
      expect(() => SaveSlotMetaSchema.array().parse(valid)).not.toThrow();
    });

    it('rejects missing required fields', () => {
      const invalid = [{ id: '1', name: 'Save 1' }];
      expect(() => SaveSlotMetaSchema.array().parse(invalid)).toThrow();
    });

    it('rejects wrong field types', () => {
      const invalid = [
        { id: '1', name: 'Save 1', week: 'one', year: 1, timestamp: 'now', version: '1.0' },
      ];
      expect(() => SaveSlotMetaSchema.array().parse(invalid)).toThrow();
    });
  });

  describe('clearReconstructionCache', () => {
    it('is exported and callable', () => {
      expect(() => clearReconstructionCache()).not.toThrow();
    });
  });
});
