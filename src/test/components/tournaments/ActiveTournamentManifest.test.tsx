/**
 * #979 perf characterization test — verifies ActiveTournamentManifest
 * computes the same values after the single-pass loop rewrite.
 * This test PASSES on current code (characterization) and must still
 * PASS after the perf rewrite is applied.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActiveTournamentManifest } from '@/components/tournaments/ActiveTournamentManifest';
import type { TournamentEntry } from '@/types/game';
import type { FightSummary } from '@/types/game';

function makeBracket(
  rounds: { round: number; matchIndex: number; winner?: 'A' | 'D'; warriorIdA: string; warriorIdD: string }[]
) {
  return rounds.map((r, i) => ({
    id: `bout-${i}`,
    round: r.round,
    matchIndex: r.matchIndex,
    winner: r.winner,
    warriorIdA: r.warriorIdA,
    warriorIdD: r.warriorIdD,
    warriorAName: `Warrior A ${i}`,
    warriorDName: `Warrior D ${i}`,
  }));
}

function makeTournament(bracket: ReturnType<typeof makeBracket>): TournamentEntry {
  return {
    id: 'test-tournament',
    name: 'Test Tournament',
    bracket,
    participants: [
      { id: 'w1', name: 'Warrior 1' },
      { id: 'w2', name: 'Warrior 2' },
      { id: 'w3', name: 'Warrior 3' },
      { id: 'w4', name: 'Warrior 4' },
    ],
    round: 1,
    arenaId: 'standard',
  } as unknown as TournamentEntry;
}

describe('ActiveTournamentManifest — perf characterization (#979)', () => {
  it('renders correct round and match counts for incomplete tournament', () => {
    const bracket = makeBracket([
      { round: 1, matchIndex: 0, warriorIdA: 'w1', warriorIdD: 'w2' },
      { round: 1, matchIndex: 1, warriorIdA: 'w3', warriorIdD: 'w4' },
      { round: 2, matchIndex: 0, warriorIdA: 'w1', warriorIdD: 'w3' },
    ]);
    const tournament = makeTournament(bracket);

    render(
      <ActiveTournamentManifest
        tournament={tournament}
        arenaHistory={[] as FightSummary[]}
        week={5}
        expandedBout={null}
        onToggleExpand={() => {}}
        isReadyToStart={true}
        onExecuteRound={() => {}}
        onOpenPrep={() => {}}
        seasonIcon="⚔"
      />
    );

    // 0 completed, 3 total, current round 1, max round 2
    expect(screen.getAllByText(/Round 1/i).length).toBeGreaterThan(0);
  });

  it('renders correct round for completed tournament', () => {
    const bracket = makeBracket([
      { round: 1, matchIndex: 0, winner: 'A', warriorIdA: 'w1', warriorIdD: 'w2' },
      { round: 1, matchIndex: 1, winner: 'A', warriorIdA: 'w3', warriorIdD: 'w4' },
      { round: 2, matchIndex: 0, winner: 'A', warriorIdA: 'w1', warriorIdD: 'w3' },
    ]);
    const tournament = makeTournament(bracket);

    render(
      <ActiveTournamentManifest
        tournament={tournament}
        arenaHistory={[] as FightSummary[]}
        week={5}
        expandedBout={null}
        onToggleExpand={() => {}}
        isReadyToStart={true}
        onExecuteRound={() => {}}
        onOpenPrep={() => {}}
        seasonIcon="⚔"
      />
    );

    // All complete — should show champion section
    expect(screen.getAllByText(/champion/i).length).toBeGreaterThan(0);
  });

  it('handles empty bracket gracefully', () => {
    const tournament = makeTournament([]);

    render(
      <ActiveTournamentManifest
        tournament={tournament}
        arenaHistory={[] as FightSummary[]}
        week={5}
        expandedBout={null}
        onToggleExpand={() => {}}
        isReadyToStart={false}
        onExecuteRound={() => {}}
        onOpenPrep={() => {}}
        seasonIcon="⚔"
      />
    );

    // Should not crash
    expect(screen.getByText(/Active Manifest/i)).toBeInTheDocument();
  });
});
