import { describe, it, expect } from 'vitest';
import { checkBankruptcy } from '@/engine/pipeline/services/weekPipeline/finalize';
import { GameState } from '@/types/game';

describe('weekPipeline/finalize', () => {
  describe('checkBankruptcy', () => {
    it('returns true if treasury falls below threshold', () => {
      // Threshold is typically 0 or slightly negative, let's assume 0 for test logic check
      const state = { treasury: 500 } as GameState;
      // If BANKRUPTCY_THRESHOLD is e.g. -50000, we just mock enough negative delta
      expect(checkBankruptcy(state, [{ treasuryDelta: -1000000 }])).toBe(true);
    });

    it('returns false if treasury stays above threshold', () => {
      const state = { treasury: 500 } as GameState;
      expect(checkBankruptcy(state, [{ treasuryDelta: -10 }])).toBe(false);
    });
  });
});
