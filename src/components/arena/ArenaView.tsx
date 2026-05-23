import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/state/useGameStore';
import { classifyEvent } from '@/lib/boutUtils';
import ArenaBackground from './ArenaBackground';
import ArenaFighter from './ArenaFighter';
import SpeechBubble from './SpeechBubble';
import MiniCombatLog from './MiniCombatLog';
import ParticleSystem from './effects/ParticleSystem';
import ScreenShake from './effects/ScreenShake';
import CrowdReactions from './crowd/CrowdReactions';
import CrowdAudio from './audio/CrowdAudio';
import WeatherAudio from './audio/WeatherAudio';
import { useArenaAnimation, setFighterNames } from '@/hooks/useArenaAnimation';
import type { MinuteEvent } from '@/types/combat.types';
import type { FightingStyle, WeatherType } from '@/types/game';
import type { ArenaTier } from './ArenaBackground';
import type { CrowdState } from './crowd/CrowdReactions';

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
}/**
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
  * @returns The result.
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
 * @returns The result.
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
  maxHpA = 50,
  maxHpD = 50,
  className,
}: ArenaViewProps) {
  const store = useGameStore();
  const arenaPrefs = store.arenaPreferences;

  // Track event triggers for effects
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [weaponSwing, setWeaponSwing] = useState<{ active: boolean; fighter: 'A' | 'D' | null }>({
    active: false,
    fighter: null,
  });

  // Set fighter names for text matching
  useEffect(() => {
    setFighterNames(nameA, nameD);
  }, [nameA, nameD]);

  // Arena animation state
  const { fighterA, fighterD, bubbles, hpA, hpD, fpA, fpD, removeBubble } = useArenaAnimation(
    log,
    visibleCount,
    maxHpA,
    maxHpD,
    winner,
    isComplete
  );

  // Determine if fighters are dead
  const isDeadA = isComplete && winner === 'D';
  const isDeadD = isComplete && winner === 'A';
  const isWinnerA = isComplete && winner === 'A';
  const isWinnerD = isComplete && winner === 'D';

  // Track visible events for effects
  useEffect(() => {
    if (visibleCount > 0 && visibleCount <= log.length) {
      const event = log[visibleCount - 1];
      if (event) {
        const type = classifyEvent(event);
        setLastEventType(type);

        // Trigger weapon swing on hit/crit
        if (type === 'hit' || type === 'crit') {
          const isA = event.text.toLowerCase().includes(nameA.toLowerCase());
          setWeaponSwing({ active: true, fighter: isA ? 'A' : 'D' });
          setTimeout(() => setWeaponSwing({ active: false, fighter: null }), 200);
        }
      }
    }
  }, [visibleCount, log, nameA]);

  // Determine crowd state based on recent events
  const crowdState: CrowdState = useMemo(() => {
    if (!lastEventType) return 'idle';
    if (lastEventType === 'death') return isComplete ? 'silence' : 'roar';
    if (lastEventType === 'crit') return 'roar';
    if (lastEventType === 'hit') return 'cheer';
    if (visibleCount > 0 && visibleCount < 3) return 'anticipation';
    return 'idle';
  }, [lastEventType, isComplete, visibleCount]);

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
        weather={weather}
        arenaId={arenaId}
        className="absolute inset-0"
      />

      {/* Crowd Reactions */}
      {arenaPrefs.effectsEnabled && <CrowdReactions tier={arenaTier} state={crowdState} />}

      {/* Audio Systems */}
      <CrowdAudio
        state={crowdState}
        volume={arenaPrefs.audioVolume}
        enabled={arenaPrefs.audioEnabled}
        isBloodMoon={weather === 'Blood Moon'}
      />
      {weather && (
        <WeatherAudio
          weather={weather}
          arenaId={arenaId}
          volume={arenaPrefs.audioVolume}
          enabled={arenaPrefs.audioEnabled}
        />
      )}

      {/* Particle System */}
      {arenaPrefs.effectsEnabled && (
        <ParticleSystem trigger={lastEventType} sourceX={50} sourceY={50} />
      )}

      {/* Speech Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute"
          style={{
            left: bubble.speaker === 'A' ? `${fighterA.x}%` : `${fighterD.x}%`,
            bottom: bubble.speaker === 'A' ? `${40 + fighterA.y}%` : `${40 + fighterD.y}%`,
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <SpeechBubble
            bubble={bubble}
            position={bubble.speaker === 'A' ? 'left' : 'right'}
            onDismiss={removeBubble}
          />
        </div>
      ))}

      {/* Fighter A */}
      <ArenaFighter
        name={nameA}
        pose={fighterA}
        stats={{
          maxHp: maxHpA,
          currentHp: hpA,
          maxFp: 100,
          currentFp: fpA,
        }}
        style={styleA}
        isWinner={isWinnerA}
        isDead={isDeadA}
        isActive={fighterA.stance === 'lunging' || fighterA.stance === 'advancing'}
      />

      {/* Fighter D */}
      <ArenaFighter
        name={nameD}
        pose={fighterD}
        stats={{
          maxHp: maxHpD,
          currentHp: hpD,
          maxFp: 100,
          currentFp: fpD,
        }}
        style={styleD}
        isWinner={isWinnerD}
        isDead={isDeadD}
        isActive={fighterD.stance === 'lunging' || fighterD.stance === 'advancing'}
      />

      {/* Mini Combat Log - positioned at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <MiniCombatLog events={log} visibleCount={visibleCount} isPlaying={!!isPlaying} />
      </div>
    </ScreenShake>
  );
}
