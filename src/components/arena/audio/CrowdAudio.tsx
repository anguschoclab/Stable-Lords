import { useEffect, useRef, useState } from 'react';
import type { CrowdState } from '../crowd/CrowdReactions';

interface CrowdAudioProps {
  state: CrowdState;
  volume: number;
  enabled: boolean;
}

// Crowd audio trigger mapping
const CROWD_SOUNDS: Record<CrowdState, string | null> = {
  idle: null,
  anticipation: null,
  cheer: 'crowd-cheer-hit',
  roar: 'crowd-roar-crit',
  gasp: 'crowd-gasp',
  silence: null,
  chant: 'crowd-blood-moon',
}; /**
 * Crowd audio.
 * @param - { state, volume, enabled }.
 */

/**
 * Crowd audio.
 * @param - { state, volume, enabled }.
 */
export default function CrowdAudio({ state, volume, enabled }: CrowdAudioProps) {
  const lastStateRef = useRef<CrowdState>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enabled || !isInitialized) return;

    // Play one-shot for state transitions
    if (state !== lastStateRef.current) {
      const soundId = CROWD_SOUNDS[state];
      if (soundId) {
        // For now, use existing audio manager with volume adjustment
        // In full implementation, would load specific crowd sounds
        // Audio placeholder — implement actual playback here
      }
      lastStateRef.current = state;
    }
  }, [state, volume, enabled, isInitialized]);

  useEffect(() => {
    if (enabled) {
      setIsInitialized(true);
    }
  }, [enabled]);

  // This is a logic component - no visual output
  return null;
}
