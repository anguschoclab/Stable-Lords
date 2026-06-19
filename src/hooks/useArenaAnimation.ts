import { useState, useEffect, useCallback } from 'react';
import type { FighterPose, SpeechBubble, ArenaState } from '@/types/arena.types';
import type { MinuteEvent } from '@/types/combat.types';
import { processArenaEvent } from './arenaAnimationUtils';

const DEFAULT_POSE_A: FighterPose = {
  x: 25,
  y: 0,
  facing: 'right',
  stance: 'neutral',
};

const DEFAULT_POSE_D: FighterPose = {
  x: 75,
  y: 0,
  facing: 'left',
  stance: 'neutral',
};

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
  const [state, setState] = useState<ArenaState>({
    fighterA: { ...DEFAULT_POSE_A },
    fighterD: { ...DEFAULT_POSE_D },
    bubbles: [],
    hpA: maxHpA,
    hpD: maxHpD,
    fpA: 100,
    fpD: 100,
  });

  // Process event and update poses
  const processEvent = useCallback((event: MinuteEvent, index: number) => {
    setState((prev) => processArenaEvent(prev, event, index, fighterNameA.toLowerCase(), fighterNameD.toLowerCase()));
  }, [fighterNameA, fighterNameD]);

  // Track visible event changes
  useEffect(() => {
    if (visibleCount > 0 && visibleCount <= log.length) {
      const event = log[visibleCount - 1];
      if (event) {
        processEvent(event, visibleCount - 1);
      }
    }
  }, [visibleCount, log, processEvent]);

  // Handle completion - set victory poses
  useEffect(() => {
    if (isComplete && winner) {
      setState((prev) => ({
        ...prev,
        fighterA: {
          ...prev.fighterA,
          stance: winner === 'A' ? 'victorious' : 'defeated',
          y: winner === 'A' ? 0 : 15,
        },
        fighterD: {
          ...prev.fighterD,
          stance: winner === 'D' ? 'victorious' : 'defeated',
          y: winner === 'D' ? 0 : 15,
        },
      }));
    }
  }, [isComplete, winner]);

  const addBubble = useCallback((bubble: Omit<SpeechBubble, 'id'>) => {
    const id = `bubble-${crypto.randomUUID()}`;
    setState((prev) => ({
      ...prev,
      bubbles: [...prev.bubbles, { ...bubble, id }],
    }));
  }, []);

  const removeBubble = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bubbles: prev.bubbles.filter((b) => b.id !== id),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      fighterA: { ...DEFAULT_POSE_A },
      fighterD: { ...DEFAULT_POSE_D },
      bubbles: [],
      hpA: maxHpA,
      hpD: maxHpD,
      fpA: 100,
      fpD: 100,
    });
  }, [maxHpA, maxHpD]);

  const updatePose = useCallback((fighter: 'A' | 'D', pose: Partial<FighterPose>) => {
    setState((prev) => ({
      ...prev,
      [fighter === 'A' ? 'fighterA' : 'fighterD']: {
        ...prev[fighter === 'A' ? 'fighterA' : 'fighterD'],
        ...pose,
      },
    }));
  }, []);

  return {
    ...state,
    addBubble,
    removeBubble,
    reset,
    updatePose,
  };
  }
