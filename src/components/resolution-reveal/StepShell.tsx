import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const ANIMATION = {
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  rise: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
} as const;

interface StepShellProps {
  variant?: keyof typeof ANIMATION;
  className?: string;
  children: ReactNode;
}

/** Shared animated step container — one motion.div, per-step variant payloads. */
export function StepShell({ variant = 'slide', className, children }: StepShellProps) {
  const a = ANIMATION[variant];
  return (
    <motion.div
      initial={a.initial}
      animate={a.animate}
      exit={a.exit}
      className={`h-full p-6${className ? ` ${className}` : ''}`}
    >
      {children}
    </motion.div>
  );
}
