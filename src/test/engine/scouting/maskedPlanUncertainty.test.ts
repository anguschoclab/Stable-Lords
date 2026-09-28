/**
 * Plan D.3 (deferred) — scout reports must render uncertainty, not confident
 * lies, when the target stable masks its committed plan. The report flags the
 * plan section's provenance as suspect rather than presenting decoy numbers
 * as verified intel.
 */
import { describe, it, expect } from 'vitest';
import { generateScoutReport } from '@/engine/scouting/scouting';
import {
  makeWarrior,
} from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';

describe('scout report — masked plan uncertainty', () => {
  it('flags plan tendencies as possibly masked when the target carries a decoy', () => {
    const masked = makeWarrior({
      planMasked: true,
      plan: { OE: 8, AL: 3 } as never,
      lastBoutWeek: 4,
    });
    const { report } = generateScoutReport(masked, 'Expert', 5, new SeededRNGService(1));
    expect(report.possiblyMaskedPlan).toBe(true);
  });

  it('does not flag a report whose target commits plans in the open', () => {
    const open = makeWarrior({
      planMasked: false,
      plan: { OE: 8, AL: 3 } as never,
      lastBoutWeek: 4,
    });
    const { report } = generateScoutReport(open, 'Expert', 5, new SeededRNGService(1));
    expect(report.possiblyMaskedPlan).toBeFalsy();
  });

  it('a masked target with no committed plan still reads as uncertain on lower qualities', () => {
    const maskedNoPlan = makeWarrior({ planMasked: true });
    const { report } = generateScoutReport(maskedNoPlan, 'Detailed', 5, new SeededRNGService(1));
    expect(report.possiblyMaskedPlan).toBe(true);
    expect(report.suspectedOE).toBeUndefined();
  });
});
