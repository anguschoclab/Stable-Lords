import { useState, useEffect, useCallback } from 'react';
import type { FighterPose, SpeechBubble, ArenaState } from '@/types/arena.types';
import type { MinuteEvent } from '@/types/combat.types';
import {
  processArenaEvent,
  initialArenaState,
  applyVictoryPoses,
  appendBubble,
  removeBubbleById,
  patchFighterPose,
} from './arenaAnimationUtils';

/**
 * Defines the shape of use arena animation return.
 */
export interface UseArenaAnimationReturn extends ArenaState {
  /** Add a speech bubble */
  addBubble: (bubble: Omit<SpeechBubble, 'id'>) => void;
  /** Remove a speech bubble by id */
  removeBubble: (id: string) => void;
  /** Reset arena to initial state */
  reset: () => void;
  /** Manually update a fighter's pose */
  updatePose: (fighter: 'A' | 'D', pose: Partial<FighterPose>) => void;
}

/**
 * Hook to manage arena animation state based on bout events
 */
export function useArenaAnimation(
  log: MinuteEvent[],
  visibleCount: number,
  maxHpA: number,
  maxHpD: number,
  winner: 'A' | 'D' | null,
  isComplete: boolean,
  fighterNameA: string = '',
  fighterNameD: string = ''
): UseArenaAnimationReturn {
  const [state, setState] = useState<ArenaState>(() => initialArenaState(maxHpA, maxHpD));

  // Process event and update poses
  const processEvent = useCallback(
    (event: MinuteEvent, index: number) => {
      setState((prev) =>
        processArenaEvent(
          prev,
          event,
          index,
          fighterNameA.toLowerCase(),
          fighterNameD.toLowerCase()
        )
      );
    },
    [fighterNameA, fighterNameD]
  );

  // Track visible event changes
  useEffect(() => {
    if (visibleCount > 0 && visibleCount <= log.length) {
      const event = log[visibleCount - 1];
      if (event) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- event-driven animation state update
        processEvent(event, visibleCount - 1);
      }
    }
  }, [visibleCount, log, processEvent]);

  // Handle completion - set victory poses
  useEffect(() => {
    if (isComplete && winner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- victory pose is completion-driven
      setState((prev) => applyVictoryPoses(prev, winner));
    }
  }, [isComplete, winner]);

  const addBubble = useCallback((bubble: Omit<SpeechBubble, 'id'>) => {
    setState((prev) => appendBubble(prev, bubble));
  }, []);

  const removeBubble = useCallback((id: string) => {
    setState((prev) => removeBubbleById(prev, id));
  }, []);

  const reset = useCallback(() => {
    setState(initialArenaState(maxHpA, maxHpD));
  }, [maxHpA, maxHpD]);

  const updatePose = useCallback((fighter: 'A' | 'D', pose: Partial<FighterPose>) => {
    setState((prev) => patchFighterPose(prev, fighter, pose));
  }, []);

  return {
    ...state,
    addBubble,
    removeBubble,
    reset,
    updatePose,
  };
}
