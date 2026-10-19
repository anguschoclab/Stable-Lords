/**
 * useKeyboardShortcuts — global bindings (Space, E, ?, 1-9) must keep
 * working; `/` focuses the global search input.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

function press(key: string, target: HTMLElement | null = null) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'target', { value: target ?? document.body });
  window.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('Space navigates to the arena', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSidebar: vi.fn() }));
    press(' ');
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/stable/arena' });
  });

  it('E toggles the sidebar', () => {
    const onToggleSidebar = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));
    press('e');
    expect(onToggleSidebar).toHaveBeenCalled();
  });

  it('? navigates to help', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSidebar: vi.fn() }));
    press('?');
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/help' });
  });

  it('/ focuses the global search input when present', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSidebar: vi.fn() }));
    const input = document.createElement('input');
    input.id = 'global-search-input';
    document.body.appendChild(input);
    press('/');
    expect(document.activeElement).toBe(input);
  });

  it('does not hijack keys pressed inside inputs', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSidebar: vi.fn() }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(' ', input);
    press('5', input);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
