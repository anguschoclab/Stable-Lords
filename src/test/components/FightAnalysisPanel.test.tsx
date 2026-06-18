import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FightAnalysisPanel } from '@/components/bout-viewer/FightAnalysisPanel';
import type { FightAnalysis } from '@/engine/narrative/fightAnalysis';

const analysis: FightAnalysis = {
  styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
  decisiveExchange: {
    index: 2,
    minute: 3,
    reasonCodes: ['AI_PUSH_FATIGUE'],
    summary: 'Broke open at minute 3.',
  },
  fatigue: { fatiguedSide: 'D', crossoverExchange: 2 },
  tale: { hitsA: 3, hitsD: 0, damageA: 22, damageD: 0, ripostesA: 0, ripostesD: 0 },
  factors: [
    { label: 'Style matchup', detail: 'LA vs TP favored Aulus (+2).', favored: 'A', weight: 0.5 },
    {
      label: 'Damage output',
      detail: 'Aulus dealt 22 more total damage.',
      favored: 'A',
      weight: 0.9,
    },
    { label: 'Outcome', detail: 'Broke open at minute 3.', favored: 'A', weight: 0.1 },
  ],
};

describe('FightAnalysisPanel', () => {
  it('renders each ranked factor label and detail', () => {
    render(<FightAnalysisPanel analysis={analysis} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText('Style matchup')).toBeInTheDocument();
    expect(screen.getByText(/22 more total damage/)).toBeInTheDocument();
  });

  it('renders the decisive-exchange summary', () => {
    render(<FightAnalysisPanel analysis={analysis} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText(/Broke open at minute 3/)).toBeInTheDocument();
  });

  it('renders nothing when analysis is undefined', () => {
    const { container } = render(
      <FightAnalysisPanel analysis={undefined} nameA="Aulus" nameD="Bran" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
