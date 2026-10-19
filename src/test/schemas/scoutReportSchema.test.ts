/**
 * V16/F3d — ScoutReportDataSchema must round-trip every field
 * `generateScoutReport` emits; `suspectedTraits` in particular was silently
 * stripped on save because it existed only on the internal ScoutReport type.
 */
import { describe, it, expect } from 'vitest';
import { ScoutReportDataSchema } from '@/schemas/economySchemas';

const baseReport = {
  id: 'rpt-1',
  warriorId: 'w-1',
  warriorName: 'Cassius',
  style: 'STRIKING ATTACK',
  quality: 'Expert',
  week: 5,
  attributeRanges: { ST: 'Formidable (14-16)' },
  record: '5W-2L',
  knownInjuries: [],
  notes: 'report notes',
};

describe('ScoutReportDataSchema', () => {
  it('round-trips suspectedTraits discovered during scouting', () => {
    const parsed = ScoutReportDataSchema.parse({
      ...baseReport,
      suspectedTraits: ['Iron Skin', 'Bloodlust'],
    });
    expect(parsed.suspectedTraits).toEqual(['Iron Skin', 'Bloodlust']);
  });

  it('round-trips plan-intel and competence fields', () => {
    const parsed = ScoutReportDataSchema.parse({
      ...baseReport,
      suspectedOE: 'High',
      suspectedAL: 'Low',
      possiblyMaskedPlan: true,
      suspectedCompetence: 'Veteran',
    });
    expect(parsed.possiblyMaskedPlan).toBe(true);
    expect(parsed.suspectedCompetence).toBe('Veteran');
  });
});
