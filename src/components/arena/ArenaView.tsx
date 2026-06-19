import { cn } from '@/lib/utils';
import { useGameStore } from '@/state/useGameStore';
import ArenaBackground from './ArenaBackground';
import ArenaAudio from './ArenaAudio';
import SpeechBubbles from './SpeechBubbles';
import FighterPair from './FighterPair';
import MiniCombatLog from './MiniCombatLog';
import ParticleSystem from './effects/ParticleSystem';
import ScreenShake from './effects/ScreenShake';
import CrowdReactions from './crowd/CrowdReactions';
import { useArenaAnimation } from '@/hooks/useArenaAnimation';
import { useLastEventType, useCrowdState } from '@/hooks/useArenaEventEffects';
import { calculateFighterStatuses } from './arenaUtils';
import { DEFAULT_MAX_HP } from '@/constants/combat';
import type { MinuteEvent } from '@/types/combat.types';
import type { FightingStyle, WeatherType } from '@/types/game';
import type { ArenaTier } from './ArenaBackground';

interface ArenaViewProps {
  nameA: string;
  nameD: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  log: MinuteEvent[];
  winner: 'A' | 'D' | null;
  by?: string;
  visibleCount: number;
  isPlaying?: boolean;
  isComplete?: boolean;
  arenaTier?: ArenaTier;
  weather?: WeatherType;
  arenaId?: string;
  maxHpA?: number;
  maxHpD?: number;
  transcript?: string[];
  className?: string;
} /**
   * Arena view.
   * @param  - {
  name a,
  name d,
  style a,
  style d,
  log,
  winner,
  visible count,
  is playing,
  is complete = false,
  arena tier = 'standard',
  weather = 'clear',
  arena id,
  gear a,
  gear d,
  max hp a = 50,
  max hp d = 50,
  class name,
}.
   */

/**
 * Arena view.
 * @param  - {
  name a,
  name d,
  style a,
  style d,
  log,
  winner,
  visible count,
  is playing,
  is complete = false,
  arena tier = 'standard',
  weather = 'clear',
  arena id,
  gear a,
  gear d,
  max hp a = 50,
  max hp d = 50,
  class name,
}.
 */
export default function ArenaView({
  nameA,
  nameD,
  styleA,
  styleD,
  log,
  winner,
  visibleCount,
  isPlaying,
  isComplete = false,
  arenaTier = 'standard',
  weather = 'Clear',
  arenaId,
  maxHpA = DEFAULT_MAX_HP,
  maxHpD = DEFAULT_MAX_HP,
  className,
}: ArenaViewProps) {
  const store = useGameStore();
  const arenaPrefs = store.arenaPreferences;
  const season = store.season?.toLowerCase() as
    | 'spring'
    | 'summer'
    | 'fall'
    | 'winter'
    | 'tournament'
    | undefined;

  // Arena animation state
  const { fighterA, fighterD, bubbles, hpA, hpD, fpA, fpD, removeBubble } = useArenaAnimation(
    log,
    visibleCount,
    maxHpA,
    maxHpD,
    winner,
    isComplete,
    nameA,
    nameD
  );

  // Extracted: Event tracking and crowd state
  const lastEventType = useLastEventType(log, visibleCount);
  const crowdState = useCrowdState(lastEventType, isComplete, visibleCount);

  // Extracted: Fighter status calculations
  const { isDeadA, isDeadD, isWinnerA, isWinnerD } = calculateFighterStatuses(winner, isComplete);

  return (
    <ScreenShake
      trigger={lastEventType}
      intensity={
        arenaPrefs.screenShakeIntensity === 'off' ? 'low' : arenaPrefs.screenShakeIntensity
      }
      disabled={!arenaPrefs.effectsEnabled || arenaPrefs.screenShakeIntensity === 'off'}
      className={cn('relative w-full h-full min-h-96 overflow-hidden rounded-none', className)}
    >
      {/* Arena Background */}
      <ArenaBackground
        tier={arenaTier}
        season={season}
        weather={weather}
        arenaId={arenaId}
        className="absolute inset-0"
      />

      {/* Crowd Reactions */}
      {arenaPrefs.effectsEnabled && <CrowdReactions tier={arenaTier} state={crowdState} />}

      {/* Audio Systems */}
      <ArenaAudio
        crowdState={crowdState}
        weather={weather}
        arenaId={arenaId}
        arenaPrefs={arenaPrefs}
      />

      {/* Particle System */}
      {arenaPrefs.effectsEnabled && (
        <ParticleSystem trigger={lastEventType} sourceX={50} sourceY={50} />
      )}

      {/* Speech Bubbles */}
      <SpeechBubbles
        bubbles={bubbles}
        fighterA={fighterA}
        fighterD={fighterD}
        onDismiss={removeBubble}
      />

      {/* Fighter Pair */}
      <FighterPair
        nameA={nameA}
        nameD={nameD}
        styleA={styleA}
        styleD={styleD}
        fighterA={fighterA}
        fighterD={fighterD}
        hpA={hpA}
        hpD={hpD}
        fpA={fpA}
        fpD={fpD}
        maxHpA={maxHpA}
        maxHpD={maxHpD}
        isWinnerA={isWinnerA}
        isWinnerD={isWinnerD}
        isDeadA={isDeadA}
        isDeadD={isDeadD}
      />

      {/* Mini Combat Log - positioned at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <MiniCombatLog events={log} visibleCount={visibleCount} isPlaying={!!isPlaying} />
      </div>
    </ScreenShake>
  );
}
