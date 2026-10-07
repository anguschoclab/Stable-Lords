import { useCallback } from 'react';

/**
 * Accessibility/interaction props for a div-styled expandable bar header:
 * button role, keyboard Enter/Space activation, click toggle, and
 * expanded-state labeling. Spread the result onto the header element.
 */
export function useToggleBarProps(opts: {
  expanded: boolean;
  /** Noun used in the aria-label, e.g. 'combat log' → "Expand combat log". */
  label: string;
  onToggle: () => void;
}) {
  const { expanded, label, onToggle } = opts;
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-expanded': expanded,
    'aria-label': `${expanded ? 'Collapse' : 'Expand'} ${label}`,
    onClick: onToggle,
    onKeyDown,
  };
}
