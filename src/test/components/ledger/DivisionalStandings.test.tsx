/**
 * DivisionalStandings — standings table at rival scale uses the shared
 * list shell (search + sort + bounded window).
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DivisionalStandings } from '@/components/ledger/SeasonSynthesis/components/DivisionalStandings';
import type { RivalPerformance } from '@/components/ledger/SeasonSynthesis/hooks/useSeasonData';

function perf(id: string, name: string, wins: number, losses: number, kills = 0): RivalPerformance {
  return {
    id,
    name,
    philosophy: 'Balanced',
    winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
    totalWins: wins,
    totalLosses: losses,
    totalKills: kills,
  };
}

describe('DivisionalStandings — list shell', () => {
  it('filters rows by stable name', () => {
    render(
      <DivisionalStandings
        rivals={[perf('a', 'Iron Wolves', 10, 2), perf('b', 'Ash Reapers', 5, 5)]}
      />
    );
    fireEvent.change(screen.getByLabelText('Filter standings'), { target: { value: 'wolves' } });
    expect(screen.getByText('Iron Wolves')).toBeInTheDocument();
    expect(screen.queryByText('Ash Reapers')).not.toBeInTheDocument();
  });

  it('windows the table past pageSize', () => {
    const rivals = Array.from({ length: 60 }, (_, i) =>
      perf(`r${i}`, `Stable ${String(i).padStart(3, '0')}`, 10, 10)
    );
    render(<DivisionalStandings rivals={rivals} />);
    expect(screen.queryByText('Stable 059')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+\d+ more/i }));
    expect(screen.getByText('Stable 059')).toBeInTheDocument();
  });
});
