/**
 * Global keyboard shortcuts for Stable Lords.
 *
 * Shortcuts (active when no input/textarea is focused):
 *   Space       — Navigate to Combat (advance time)
 *   1-9         — Navigate to nav items by index
 *   E           — Toggle event log sidebar
 *   ?           — Navigate to Help
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

const NAV_ROUTES = [
  '/', // 1 — Command Hub
  '/stable/arena', // 2 — Combat
  '/stable/roster', // 3 — Stable Overview
  '/stable/training', // 4 — Training
  '/world/intelligence', // 5 — Intelligence/Scouting
  '/stable/equipment', // 6 — Equipment
  '/world/tournaments', // 7 — Tournaments
  '/world/chronicle', // 8 — Chronicle
  '/stable/finance', // 9 — Finance
];

interface UseKeyboardShortcutsOpts {
  onToggleSidebar: () => void;
} /**
 * React hook: use keyboard shortcuts.
 * @param - { on toggle sidebar }.
 */

/**
 * React hook: use keyboard shortcuts.
 * @param - { on toggle sidebar }.
 */
export function useKeyboardShortcuts({ onToggleSidebar }: UseKeyboardShortcutsOpts) {
  const navigate = useNavigate();

  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Skip when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Skip if modifier keys are held (allow browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // Space → go to Combat
      if (key === ' ') {
        e.preventDefault();
        navigate({ to: '/stable/arena' });
        return;
      }

      // E → toggle event log
      if (key === 'e' || key === 'E') {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // ? → help
      if (key === '?') {
        e.preventDefault();
        navigate({ to: '/help' });
        return;
      }

      // 1-9 → nav by index
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 9 && num <= NAV_ROUTES.length) {
        e.preventDefault();
        navigate({ to: NAV_ROUTES[num - 1] });
        return;
      }
    },
    [navigate, onToggleSidebar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
