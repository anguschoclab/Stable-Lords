import { useState, useEffect, useRef } from 'react';
import type { MinuteEvent, FightOutcomeBy, FightingStyle } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { useBoutPlayback } from '@/hooks/useBoutPlayback';
import { useArenaPreferences, useGameStore } from '@/state/useGameStore';
import ArenaView from './arena/ArenaView';
import TacticalLogView from './arena/TacticalLogView';
import HighlightLog from './arena/HighlightLog';
import type { ViewMode } from './arena/ViewModeToggle';
import { isIndoorArena } from '@/data/arenas';

import BoutHeader from './bout-viewer/BoutHeader';
import BoutControls from './bout-viewer/BoutControls';
import BoutResolution from './bout-viewer/BoutResolution';
import { FightAnalysisPanel } from './bout-viewer/FightAnalysisPanel';
import { AIDebugDrawer } from './bout-viewer/AIDebugDrawer';

interface BoutViewerProps {
  nameA: string;
  nameD: string;
  styleA: string;
  styleD: string;
  log: MinuteEvent[];
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy;
  announcement?: string;
  isRivalry?: boolean;
  arenaTier?: 'training' | 'standard' | 'championship' | 'grand';
  weather?: string;
  arenaId?: string;
  transcript?: string[];
  analysis?: import('@/engine/narrative/fightAnalysis').FightAnalysis;
  exchangeLog?: import('@/types/combat.types').ExchangeLogEntry[];
  weaponIdA?: string;
  weaponIdD?: string;
  /** Full fighter objects — used only by the dev AI debug drawer to render
   *  committed plans and mask flags next to the exchange telemetry. */
  warriorA?: import('@/types/warrior.types').Warrior;
  warriorD?: import('@/types/warrior.types').Warrior;
}

/**
 * Bout viewer.
 * @param  - {
  name a,
  name d,
  style a,
  style d,
  log,
  winner,
  by,
  announcement,
  is rivalry,
  arena tier = 'standard',
  weather = 'clear',
  arena id,
}.
 */
export default function BoutViewer({
  nameA,
  nameD,
  styleA,
  styleD,
  log,
  winner,
  by,
  announcement,
  isRivalry,
  arenaTier = 'standard',
  weather = 'Clear',
  arenaId,
  analysis,
  exchangeLog,
  weaponIdA,
  weaponIdD,
  warriorA,
  warriorD,
}: BoutViewerProps) {
  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : weather;
  const scoutReports = useGameStore((s) => s.scoutReports);
  const arenaPrefs = useArenaPreferences();
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(arenaPrefs.defaultViewMode);
  const logEndRef = useRef<HTMLDivElement>(null);

  const playback = useBoutPlayback(log);
  const { visibleCount, totalEvents } = playback;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleCount]);

  const winnerName = winner === 'A' ? nameA : winner === 'D' ? nameD : null;

  const lastLogEntry = log.length > 0 ? log[log.length - 1] : null;
  const minutes = lastLogEntry ? lastLogEntry.minute : 0;

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-border/40 overflow-hidden relative shadow-2xl"
    >
      {/* Cinematic Header Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-arena-gold to-accent opacity-20" />

      {/* Fighter Header Component */}
      <BoutHeader
        nameA={nameA}
        nameD={nameD}
        styleA={styleA as FightingStyle}
        styleD={styleD as FightingStyle}
        winner={winner}
        isRivalry={isRivalry}
        minutes={minutes}
        totalEvents={totalEvents}
        visibleCount={visibleCount}
        expanded={expanded}
        onToggleExpanded={() => setExpanded(!expanded)}
      />

      {expanded && (
        <BoutBody
          nameA={nameA}
          nameD={nameD}
          styleA={styleA}
          styleD={styleD}
          log={log}
          winner={winner}
          winnerName={winnerName}
          by={by}
          announcement={announcement}
          arenaTier={arenaTier}
          effectiveWeather={effectiveWeather}
          arenaId={arenaId}
          minutes={minutes}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            // Persist as new default if user explicitly changes
            setArenaPreferences({ defaultViewMode: mode });
          }}
          playback={playback}
          analysis={analysis}
          exchangeLog={exchangeLog}
          weaponIdA={weaponIdA}
          weaponIdD={weaponIdD}
          warriorA={warriorA}
          warriorD={warriorD}
          scoutReports={scoutReports}
        />
      )}
    </Surface>
  );
}

interface BoutBodyProps extends Pick<
  BoutViewerProps,
  | 'nameA'
  | 'nameD'
  | 'styleA'
  | 'styleD'
  | 'log'
  | 'winner'
  | 'by'
  | 'announcement'
  | 'arenaTier'
  | 'arenaId'
  | 'analysis'
  | 'exchangeLog'
  | 'weaponIdA'
  | 'weaponIdD'
  | 'warriorA'
  | 'warriorD'
> {
  winnerName: string | null;
  effectiveWeather: string;
  minutes: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  playback: ReturnType<typeof useBoutPlayback>;
  scoutReports: ReturnType<typeof useGameStore.getState>['scoutReports'];
}

/** The expanded viewer body: controls, arena/log, highlights, resolution, panels. */
function BoutBody({
  nameA,
  nameD,
  styleA,
  styleD,
  log,
  winner,
  winnerName,
  by,
  announcement,
  arenaTier,
  effectiveWeather,
  arenaId,
  minutes,
  viewMode,
  onViewModeChange,
  playback,
  analysis,
  exchangeLog,
  weaponIdA,
  weaponIdD,
  warriorA,
  warriorD,
  scoutReports,
}: BoutBodyProps) {
  const {
    isPlaying,
    speed,
    setSpeed,
    visibleCount,
    totalEvents,
    isComplete,
    reset,
    skipToEnd,
    togglePlay,
  } = playback;

  return (
    <div className="animate-in motion-reduce:animate-none fade-in slide-in-from-top-2 duration-700">
      {/* Simulation Controls */}
      <BoutControls
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        isPlaying={isPlaying}
        speed={speed}
        setSpeed={setSpeed}
        visibleCount={visibleCount}
        totalEvents={totalEvents}
        onReset={reset}
        onTogglePlay={togglePlay}
        onSkipToEnd={skipToEnd}
      />

      {/* Content Area - Arena or Log */}
      {viewMode === 'arena' ? (
        <ArenaView
          nameA={nameA}
          nameD={nameD}
          styleA={styleA as FightingStyle}
          styleD={styleD as FightingStyle}
          log={log}
          winner={winner}
          visibleCount={visibleCount}
          isPlaying={isPlaying}
          isComplete={isComplete}
          arenaTier={arenaTier}
          weather={effectiveWeather as import('@/types/game').WeatherType}
          arenaId={arenaId}
          maxHpA={50}
          maxHpD={50}
          weaponIdA={weaponIdA}
          weaponIdD={weaponIdD}
        />
      ) : (
        <TacticalLogView log={log} visibleCount={visibleCount} />
      )}

      {/* Highlight Reel — curated notable minutes */}
      <HighlightLog log={log} visibleCount={visibleCount} />

      {/* Cinematic Resolution Banner, fallbacks, and comms link overlay */}
      <BoutResolution
        isComplete={isComplete}
        winner={winner}
        winnerName={winnerName}
        by={by}
        minutes={minutes}
        totalEvents={totalEvents}
        announcement={announcement}
      />

      {/* Fight Analysis Panel */}
      <FightAnalysisPanel analysis={analysis} nameA={nameA} nameD={nameD} />

      {/* Dev-only AI telemetry drawer */}
      <AIDebugDrawer
        exchangeLog={exchangeLog}
        warriorA={warriorA}
        warriorD={warriorD}
        scoutReports={scoutReports}
      />
    </div>
  );
}
