// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Help from '@/pages/Help';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

describe('Help — keyboard shortcuts section', () => {
  it('renders kbd rows for the global shortcuts', () => {
    render(<Help />);
    expect(screen.getByRole('button', { name: /keyboard shortcuts/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    for (const k of ['Space', 'E', '/', '?', '1', '9']) {
      expect(screen.getByText(k).tagName).toBe('KBD');
    }
    expect(screen.getByText('Command Hub')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });
});
