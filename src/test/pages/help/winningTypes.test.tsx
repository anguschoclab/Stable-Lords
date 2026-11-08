// @vitest-environment jsdom
/**
 * V25 — Help codex "Winning Warrior Types" section: Assur's three ways
 * to win and the archetype guides, taught in the codex.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Help from '@/pages/Help';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

describe('Help — Winning Warrior Types codex', () => {
  it('renders the archetypes section', () => {
    render(<Help />);
    expect(screen.getByRole('button', { name: /winning warrior types/i })).toBeInTheDocument();
  });

  it('teaches the three ways to win', () => {
    render(<Help />);
    expect(screen.getAllByText(/offensive/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/defensive/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hybrid/i).length).toBeGreaterThan(0);
  });

  it('names the hybrid archetypes', () => {
    render(<Help />);
    expect(screen.getAllByText(/tank/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ripost/i).length).toBeGreaterThan(0);
  });
});
