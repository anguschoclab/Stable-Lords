// @vitest-environment jsdom
/**
 * Plan D.3 — masked-plan uncertainty display. A scout report on a deceptive
 * stable must show the plan section as suspect rather than presenting decoy
 * tendencies as verified intel.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CombatAnalysis } from '@/components/scouting/components/CombatAnalysis';
import { ScoutReportDetails } from '@/components/scouting/ScoutReportDetails';
import type { ScoutReportData } from '@/types/state.types';

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark" />,
}));
vi.mock('@/components/ui/tooltip', () => ({ ...__SHARED_MOCKS.tooltip }));

const report = (over: Partial<ScoutReportData> = {}): ScoutReportData => ({
  id: 'rep-1' as never,
  warriorName: 'Masked Blade',
  style: 'LungingAttack',
  quality: 'Expert',
  week: 5,
  attributeRanges: {},
  record: '8W-2L',
  knownInjuries: [],
  suspectedOE: 'High',
  suspectedAL: 'Low',
  notes: 'Fights aggressively.',
  ...over,
});

describe('scout report — masked plan uncertainty display', () => {
  it('renders an uncertainty warning when the report is flagged masked', () => {
    render(
      <CombatAnalysis suspectedOE="High" suspectedAL="Low" knownInjuries={[]} possiblyMaskedPlan />
    );
    expect(screen.getByTestId('masked-plan-warning')).toHaveTextContent(/mask|decoy|misleading/i);
  });

  it('renders no warning for an unmasked report', () => {
    render(<CombatAnalysis suspectedOE="High" suspectedAL="Low" knownInjuries={[]} />);
    expect(screen.queryByTestId('masked-plan-warning')).not.toBeInTheDocument();
  });

  it('still surfaces the warning when the report has no plan tendencies', () => {
    // A masked stable with no committed plan — the report stays honest about
    // what it could not verify rather than hiding the doubt.
    render(
      <ScoutReportDetails
        report={report({
          suspectedOE: undefined,
          suspectedAL: undefined,
          possiblyMaskedPlan: true,
        })}
        warriorName="Masked Blade"
        treasury={500}
        onScout={vi.fn()}
      />
    );
    expect(screen.getByTestId('masked-plan-warning')).toBeInTheDocument();
  });
});
