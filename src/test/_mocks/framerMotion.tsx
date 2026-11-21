/**
 * Shared passthrough stub for `framer-motion` — motion.div renders a plain
 * div and AnimatePresence renders children immediately, so specs see the
 * committed DOM without animation timing.
 */
import type { ReactNode } from 'react';

export const motion = {
  div: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  ),
};

/** Passthrough AnimatePresence — renders children immediately, no exit timing. */
export const AnimatePresence = ({ children }: { children: ReactNode }) => <>{children}</>;
