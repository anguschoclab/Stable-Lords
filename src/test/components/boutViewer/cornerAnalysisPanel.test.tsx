// @vitest-environment jsdom
/**
 * Stage E — player-facing Corner Analysis panel.
 * Condition firings are real engine facts already in the exchange log;
 * the panel renders them honestly — which side shifted plans, on which
 * trigger, and whether a corner forced the re-check at a phase boundary.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CornerAnalysisPanel } from '@/components/bout-viewer/CornerAnalysisPanel';
import type { ExchangeLogEntry } from '@/types/combat.types';

const entry = (
  minute: number,
  conditionFire?: ExchangeLogEntry['conditionFire']
): ExchangeLogEntry => ({ exchangeIndex: minute - 1, minute, conditionFire });

const LOG: ExchangeLogEntry[] = [
  entry(1),
  entry(3, { actor: 'D', trigger: 'OPPONENT_MOMENTUM_LEAD', corner: false }),
  entry(6, { actor: 'A', trigger: 'HP_BELOW', corner: true }),
];

describe('CornerAnalysisPanel', () => {
  it('renders each plan shift with its trigger and side', () => {
    render(<CornerAnalysisPanel exchangeLog={LOG} nameA="Aldric" nameD="Borvo" />);
    expect(screen.getAllByText(/plan shift/i).length).toBe(2);
    expect(screen.getByText(/OPPONENT_MOMENTUM_LEAD/)).toBeInTheDocument();
    expect(screen.getByText(/HP_BELOW/)).toBeInTheDocument();
    // Side attribution uses the display names, not A/D labels.
    expect(screen.getByText(/Borvo/)).toBeInTheDocument();
    expect(screen.getByText(/Aldric/)).toBeInTheDocument();
  });

  it('flags corner-forced re-checks distinctly', () => {
    render(<CornerAnalysisPanel exchangeLog={LOG} nameA="Aldric" nameD="Borvo" />);
    expect(screen.getByText(/corner advice/i)).toBeInTheDocument();
  });

  it('shows an honest empty state when no plan shifted', () => {
    render(<CornerAnalysisPanel exchangeLog={[entry(1), entry(2)]} nameA="A" nameD="D" />);
    expect(screen.getByText(/no plan shifts/i)).toBeInTheDocument();
  });
});
