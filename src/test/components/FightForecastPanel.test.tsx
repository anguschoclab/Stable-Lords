import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FightForecastPanel } from '@/components/bout-viewer/FightForecastPanel';
import type { FightForecast } from '@/engine/narrative/fightForecast';

const known: FightForecast = {
  opponentKnown: true,
  styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
  factors: [
    { label: 'Style matchup', detail: 'LA vs TP favors Aulus (+2).', favored: 'A', weight: 0.5 },
    { label: 'ATT edge', detail: 'Aulus projects a 4-point ATT advantage.', favored: 'A', weight: 0.5 },
  ],
};

const classified: FightForecast = {
  opponentKnown: false,
  styleMatchup: { styleA: 'Lunging Attack', styleD: null, edge: 0 },
  factors: [{ label: 'Unknown opponent', detail: 'Opponent details are CLASSIFIED.', favored: null, weight: 0.1 }],
};

describe('FightForecastPanel', () => {
  it('renders each forecast factor', () => {
    render(<FightForecastPanel forecast={known} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText('Style matchup')).toBeInTheDocument();
    expect(screen.getByText(/4-point ATT advantage/)).toBeInTheDocument();
  });

  it('shows a scout prompt when the opponent is classified', () => {
    render(<FightForecastPanel forecast={classified} nameA="Aulus" nameD="?" />);
    expect(screen.getByText(/CLASSIFIED/)).toBeInTheDocument();
  });

  it('renders nothing when forecast is undefined', () => {
    const { container } = render(<FightForecastPanel forecast={undefined} nameA="Aulus" nameD="Bran" />);
    expect(container).toBeEmptyDOMElement();
  });
});
