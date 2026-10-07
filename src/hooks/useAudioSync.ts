import { useEffect, useRef } from 'react';
import { audioManager } from '@/lib/AudioManager';
import { useArenaPreferences, useGameStore } from '@/state/useGameStore';

/**
 * Keeps `arenaPreferences.audioEnabled`/`audioVolume` in sync with the real
 * AudioManager. Persisted mute/volume state hydrates the prefs once on mount;
 * afterwards pref changes are pushed down to the manager (and persisted there).
 */
export function useAudioSync() {
  const prefs = useArenaPreferences();
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);
  const hydrated = useRef(false);

  useEffect(() => {
    void audioManager.whenReady().then(() => {
      hydrated.current = true;
      setArenaPreferences({
        audioEnabled: !audioManager.isMuted(),
        audioVolume: audioManager.getVolume(),
      });
    });
  }, [setArenaPreferences]);

  useEffect(() => {
    if (!hydrated.current) return;
    void audioManager.setMuted(!prefs.audioEnabled);
    void audioManager.setVolume(prefs.audioVolume);
  }, [prefs.audioEnabled, prefs.audioVolume]);
}
