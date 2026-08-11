import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScreenShakeProps {
  trigger: string | null;
  intensity?: 'low' | 'medium' | 'high';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} /**
   * Screen shake.
   * @param  - {
  trigger,
  intensity = 'medium',
  disabled = false,
  class name,
  children,
}.
   */

/**
 * Screen shake.
 * @param  - {
  trigger,
  intensity = 'medium',
  disabled = false,
  class name,
  children,
}.
 */
export default function ScreenShake({
  trigger,
  intensity = 'medium',
  disabled = false,
  className,
  children,
}: ScreenShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!trigger || disabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset shake state when trigger cleared
      setIsShaking(false);
      return undefined;
    }

    // Only shake on crit or death
    if (trigger === 'crit' || trigger === 'death') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- timer-based state reset is intentional
      setIsShaking(true);
      const duration = intensity === 'high' ? 500 : intensity === 'medium' ? 400 : 300;

      const timer = setTimeout(() => {
        setIsShaking(false);
      }, duration);

      return () => clearTimeout(timer);
    }

    setIsShaking(false);
    return undefined;
  }, [trigger, intensity, disabled]);

  const shakeClass = {
    low: 'animate-shake-low motion-reduce:animate-none',
    medium: 'animate-shake-medium motion-reduce:animate-none',
    high: 'animate-shake-high motion-reduce:animate-none',
  }[intensity];

  return (
    <div className={cn('transition-transform', isShaking && shakeClass, className)}>{children}</div>
  );
}
