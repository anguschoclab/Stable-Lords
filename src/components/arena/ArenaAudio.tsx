import CrowdAudio from './audio/CrowdAudio';
import WeatherAudio from './audio/WeatherAudio';
import type { CrowdState } from './crowd/CrowdReactions';
import type { WeatherType } from '@/types/shared.types';
import type { ArenaPreferences } from '@/state/slices/worldSlice';

interface ArenaAudioProps {
  crowdState: CrowdState;
  weather?: WeatherType;
  arenaId?: string;
  arenaPrefs: ArenaPreferences;
}

/**
 * Combined audio component for crowd reactions and weather ambience.
 * Extracts audio logic from ArenaView for better separation of concerns.
 */
export default function ArenaAudio({
  crowdState,
  weather,
  arenaId,
  arenaPrefs,
}: ArenaAudioProps) {
  return (
    <>
      <CrowdAudio
        state={crowdState}
        volume={arenaPrefs.audioVolume}
        enabled={arenaPrefs.audioEnabled}
      />
      {weather && (
        <WeatherAudio
          weather={weather}
          arenaId={arenaId}
          volume={arenaPrefs.audioVolume}
          enabled={arenaPrefs.audioEnabled}
        />
      )}
    </>
  );
}
