import { useMemo, useState, useEffect } from 'react';
import { classifyEvent } from '@/lib/boutUtils';
import type { MinuteEvent } from '@/types/combat.types';
import type { CrowdState } from '@/components/arena/crowd/CrowdReactions';

/**
 * Hook to track the last event type based on visible count.
 * Extracts event classification logic from ArenaView.
 */
export function useLastEventType(log: MinuteEvent[], visibleCount: number): string | null {
  const [lastEventType, setLastEventType] = useState<string | null>(null);

  useEffect(() => {
    if (visibleCount > 0 && visibleCount <= log.length) {
      const event = log[visibleCount - 1];
      if (event) {
        const type = classifyEvent(event);
        setLastEventType(type);
      }
    }
  }, [visibleCount, log]);

  return lastEventType;
}

/**
 * Hook to determine crowd state based on recent events.
 * Extracts crowd state calculation from ArenaView.
 */
export function useCrowdState(
  lastEventType: string | null,
  isComplete: boolean,
  visibleCount: number
): CrowdState {
  return useMemo(() => {
    if (!lastEventType) return 'idle';
    if (lastEventType === 'death') return isComplete ? 'silence' : 'roar';
    if (lastEventType === 'crit') return 'roar';
    if (lastEventType === 'hit') return 'cheer';
    if (visibleCount > 0 && visibleCount < 3) return 'anticipation';
    return 'idle';
  }, [lastEventType, isComplete, visibleCount]);
}
