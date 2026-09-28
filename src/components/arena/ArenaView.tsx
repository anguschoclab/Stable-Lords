import { cn } from '@/lib/utils';
import { useGameStore, useArenaPreferences } from '@/state/useGameStore';
import ArenaBackground from './ArenaBackground';
import ArenaAudio from './ArenaAudio';
import SpeechBubbles from './SpeechBubbles';
import FighterPair from './FighterPair';
import MiniCombatLog from './MiniCombatLog';
import ParticleSystem from './effects/ParticleSystem';
import ScreenShake from './effects/ScreenShake';
import WeaponTrail from './effects/WeaponTrail';
import { weaponTrailTypeFor } from './effects/weaponTrailType';
import CrowdReactions from './crowd/CrowdReactions';
import { useArenaAnimation } from '@/hooks/useArenaAnimation';
import { useLastEventType, useCrowdState } from '@/hooks/useArenaEventEffects';
import { calculateFighterStatuses } from './arenaUtils';
import { DEFAULT_MAX_HP } from '@/constants/combat';
import type { MinuteEvent } from '@/types/combat.types';
import type { FightingStyle, WeatherType } from '@/types/game';
import type { ArenaTier } from './ArenaBackground';

/** Ambient layers — crowd reactions, audio, particles, weapon trail flash. */
function AmbientFx({
  effectsEnabled,
  arenaTier,
  crowdState,
  weather,
  arenaId,
  arenaPrefs,
  lastEventType,
  isAttackEvent,
  trailWeaponId,
  attackerSide,
  visibleCount,
}: {
  effectsEnabled: boolean;
  arenaTier: ArenaTier;
  crowdState: ReturnType<typeof useCrowdState>;
  weather: WeatherType;
  arenaId: string | undefined;
  arenaPrefs: ReturnType<typeof useArenaPreferences>;
  lastEventType: ReturnType<typeof useLastEventType>;
  isAttackEvent: boolean;
  trailWeaponId: string | undefined;
  attackerSide: 'A' | 'D' | undefined;
  visibleCount: number;
}) {
  return (
    <>
      {/* Crowd Reactions */}
      {effectsEnabled && <CrowdReactions tier={arenaTier} state={crowdState} />}

      {/* Audio Systems */}
      <ArenaAudio
        crowdState={crowdState}
        weather={weather}
        arenaId={arenaId}
        arenaPrefs={arenaPrefs}
      />

      {/* Particle System */}
      {effectsEnabled && <ParticleSystem trigger={lastEventType} sourceX={50} sourceY={50} />}

      {/* Weapon Trail — keyed by visibleCount so consecutive attacks re-flash */}
      {effectsEnabled && isAttackEvent && trailWeaponId && (
        <WeaponTrail
          key={visibleCount}
          trigger
          weaponType={weaponTrailTypeFor(trailWeaponId)}
          direction={attackerSide === 'D' ? 'left' : 'right'}
          sourceX={attackerSide === 'D' ? 72 : 28}
          sourceY={45}
        />
      )}
    </>
  );
}

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
  weaponIdA?: string;
  weaponIdD?: string;
  className?: string;
}

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
/** Arena animation + event/crowd/trail/status derivation for one bout view. */
function useArenaScene(p: ArenaViewProps & { isComplete: boolean; weather: WeatherType }) {
  const { log, visibleCount, maxHpA, maxHpD, winner, isComplete, nameA, nameD } = p;
  const anim = useArenaAnimation(
    log,
    visibleCount,
    maxHpA ?? DEFAULT_MAX_HP,
    maxHpD ?? DEFAULT_MAX_HP,
    winner,
    isComplete,
    nameA,
    nameD
  );

  // Event tracking and crowd state
  const lastEventType = useLastEventType(log, visibleCount);
  const crowdState = useCrowdState(lastEventType, isComplete, visibleCount);

  // Weapon trail: flash the attacker's equipped-weapon arc on attack events.
  const isAttackEvent =
    lastEventType === 'hit' || lastEventType === 'crit' || lastEventType === 'riposte';
  const lastEvent = visibleCount > 0 ? log[visibleCount - 1] : undefined;
  const attackerSide = lastEvent?.events?.find((e) => e.actor)?.actor;
  const trailWeaponId = attackerSide === 'D' ? p.weaponIdD : p.weaponIdA;

  // Fighter status calculations
  const statuses = calculateFighterStatuses(winner, isComplete);

  return { anim, lastEventType, crowdState, isAttackEvent, trailWeaponId, attackerSide, statuses };
}

/** Fighter pair + speech bubbles + bottom mini-log — the live bout stage. */
function BoutStage(p: ArenaViewProps & { scene: ReturnType<typeof useArenaScene> }) {
  const { scene } = p;
  const { anim, statuses } = scene;
  return (
    <>
      {/* Speech Bubbles */}
      <SpeechBubbles
        bubbles={anim.bubbles}
        fighterA={anim.fighterA}
        fighterD={anim.fighterD}
        onDismiss={anim.removeBubble}
      />

      {/* Fighter Pair */}
      <FighterPair
        nameA={p.nameA}
        nameD={p.nameD}
        styleA={p.styleA}
        styleD={p.styleD}
        fighterA={anim.fighterA}
        fighterD={anim.fighterD}
        hpA={anim.hpA}
        hpD={anim.hpD}
        fpA={anim.fpA}
        fpD={anim.fpD}
        maxHpA={p.maxHpA ?? DEFAULT_MAX_HP}
        maxHpD={p.maxHpD ?? DEFAULT_MAX_HP}
        isWinnerA={statuses.isWinnerA}
        isWinnerD={statuses.isWinnerD}
        isDeadA={statuses.isDeadA}
        isDeadD={statuses.isDeadD}
      />

      {/* Mini Combat Log - positioned at bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <MiniCombatLog events={p.log} visibleCount={p.visibleCount} isPlaying={!!p.isPlaying} />
      </div>
    </>
  );
}

/** Arena stage: background, ambient FX, fighters, mini combat log. */
export default function ArenaView({
  arenaTier = 'standard',
  weather = 'Clear',
  isComplete = false,
  className,
  ...rest
}: ArenaViewProps) {
  const props = { ...rest, arenaTier, weather, isComplete, className };
  const arenaPrefs = useArenaPreferences();
  const season = useGameStore((s) => s.season?.toLowerCase()) as
    'spring' | 'summer' | 'fall' | 'winter' | 'tournament' | undefined;
  const scene = useArenaScene(props);

  return (
    <ScreenShake
      trigger={scene.lastEventType}
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
        arenaId={rest.arenaId}
        className="absolute inset-0"
      />

      <AmbientFx
        effectsEnabled={arenaPrefs.effectsEnabled}
        arenaTier={arenaTier}
        crowdState={scene.crowdState}
        weather={weather}
        arenaId={rest.arenaId}
        arenaPrefs={arenaPrefs}
        lastEventType={scene.lastEventType}
        isAttackEvent={scene.isAttackEvent}
        trailWeaponId={scene.trailWeaponId}
        attackerSide={scene.attackerSide}
        visibleCount={rest.visibleCount}
      />

      <BoutStage {...props} scene={scene} />
    </ScreenShake>
  );
}
