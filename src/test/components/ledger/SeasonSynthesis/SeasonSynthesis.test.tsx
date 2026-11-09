/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonSynthesis } from '@/components/ledger/SeasonSynthesis/index';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ledger/SeasonSynthesis/hooks/useSeasonData', () => ({
  useSeasonData: vi.fn(() => ({
    rivals: [],
    rivalPerformance: [],
    seasonGazette: [],
    metaData: { metaEntries: [], topStyle: null },
    grudges: [],
    rivalMap: {},
    season: 1,
  })),
}));

import { useSeasonData } from '@/components/ledger/SeasonSynthesis/hooks/useSeasonData';

describe('SeasonSynthesis', () => {
  it('renders nothing when there are no rivals', () => {
    const { container } = render(<SeasonSynthesis />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when there are rivals', () => {
    vi.mocked(useSeasonData).mockReturnValue({
      rivals: [{ id: 'r1', name: 'Rival 1' }],
      rivalPerformance: [],
      seasonGazette: [],
      metaData: { metaEntries: [], topStyle: null },
      grudges: [],
      rivalMap: {},
      season: 1,
    } as any);

    render(<SeasonSynthesis />);
    expect(screen.getByText('SEASON SYNTHESIS · 1')).toBeInTheDocument();
  });
});
