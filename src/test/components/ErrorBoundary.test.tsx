/**
 * ErrorBoundary — crash fallback behaviour.
 *
 * Asserts the boundary shows a generic user-facing message, logs the raw
 * error to the console, offers a retry that resets the boundary, and never
 * exposes the raw error text to the user — visibly or inside collapsed
 * markup.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Bomb({ message }: { message: string }): ReactNode {
  throw new Error(message);
}

// getDerivedStateFromError fires inside render; React also logs the error
// itself, so silence console.error per test and assert on the spy.
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
});

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
    expect(screen.queryByText('Fatal Error')).not.toBeInTheDocument();
  });

  it('shows the generic fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb message="kaboom" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Fatal Error')).toBeInTheDocument();
    expect(screen.getByText(/arena scribe cannot continue/i)).toBeInTheDocument();
  });

  it('does not expose the raw error message anywhere in the DOM', () => {
    const secret = 'TypeError: db.password is undefined at line 1337';
    render(
      <ErrorBoundary>
        <Bomb message={secret} />
      </ErrorBoundary>
    );
    // Not visible text, not inside a collapsed <details>, not in attributes.
    expect(screen.queryByText(secret, { selector: '*' })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('db.password');
  });

  it('logs the error and component stack to the console', () => {
    render(
      <ErrorBoundary>
        <Bomb message="logged" />
      </ErrorBoundary>
    );
    const boundaryCall = consoleError.mock.calls.find(
      (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('[ErrorBoundary]')
    );
    expect(boundaryCall).toBeDefined();
    expect(boundaryCall?.[1]).toBeInstanceOf(Error);
  });

  it('offers a retry that clears the error and re-renders children', () => {
    let shouldThrow = true;
    function MaybeBomb() {
      if (shouldThrow) throw new Error('transient');
      return <div>recovered</div>;
    }
    render(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Fatal Error')).toBeInTheDocument();

    // The recovery action resets the boundary; it must not pretend to reload
    // the page — label honesty: "Try Again", not "Reload Page".
    expect(screen.queryByRole('button', { name: /reload|refresh/i })).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/reload page|refresh page/i);
    const retry = screen.getByRole('button', { name: /try again/i });
    // Accessible name honesty — the aria-label matches the visible text.
    expect(retry).toHaveAttribute('aria-label', 'Try Again');
    expect(retry).toHaveTextContent('Try Again');
    shouldThrow = false;
    fireEvent.click(retry);
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('re-arms after a successful retry — a second crash shows the fallback again', () => {
    let shouldThrow = true;
    function MaybeBomb() {
      if (shouldThrow) throw new Error('transient');
      return <div>recovered</div>;
    }
    const { rerender } = render(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('recovered')).toBeInTheDocument();

    // A later crash must trip the boundary again, not render the raw error.
    shouldThrow = true;
    rerender(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Fatal Error')).toBeInTheDocument();
  });
});
