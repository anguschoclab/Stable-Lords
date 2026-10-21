// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Help from '@/pages/Help';
import { A11Y_KEY } from '@/lib/a11yPrefs';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

describe('Help — accessibility settings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-contrast');
    document.documentElement.style.zoom = '';
  });

  it('renders accessibility controls for contrast and text scale', () => {
    render(<Help />);
    expect(screen.getAllByText(/high contrast/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/text size/i)).toBeInTheDocument();
  });

  it('toggling high contrast applies data-contrast and persists', () => {
    render(<Help />);
    fireEvent.click(screen.getByRole('button', { name: /high contrast/i }));
    expect(document.documentElement.dataset.contrast).toBe('high');
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!).contrast).toBe('high');
  });

  it('selecting a larger text scale applies zoom to the root', () => {
    render(<Help />);
    fireEvent.click(screen.getByRole('button', { name: '125%' }));
    expect(document.documentElement.style.zoom).toBe('1.25');
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!).textScale).toBe(125);
  });
});

describe('Help — design bible search', () => {
  it('renders a search input and returns spec hits', () => {
    render(<Help />);
    fireEvent.click(screen.getByRole('button', { name: /design bible/i }));
    const input = screen.getByRole('searchbox', { name: /search the design bible/i });
    fireEvent.change(input, { target: { value: 'encumbrance' } });
    expect(screen.getByText(/^\d+ results?$/)).toBeInTheDocument();
  });

  it('shows an explicit recovery state when search has no results', () => {
    render(<Help />);
    fireEvent.click(screen.getByRole('button', { name: /design bible/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search the design bible/i }), {
      target: { value: 'definitely-not-a-real-mechanic' },
    });
    expect(screen.getByText(/no matching codex entry/i)).toBeInTheDocument();
  });
});

describe('Help — current information architecture', () => {
  it('uses accordion controls and links topics to the workspaces that resolve them', () => {
    render(<Help />);
    expect(screen.getByRole('button', { name: /strategy basics/i })).toHaveAttribute(
      'aria-expanded'
    );
    expect(screen.getByRole('link', { name: /configure battle plans/i })).toHaveAttribute(
      'href',
      '/stable/planner'
    );
    expect(screen.getByRole('link', { name: /open style archives/i })).toHaveAttribute(
      'href',
      '/world/style-archives'
    );
    expect(screen.getByRole('link', { name: /review stable equipment/i })).toHaveAttribute(
      'href',
      '/stable/equipment'
    );
  });
});
