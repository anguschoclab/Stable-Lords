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
 * @param props - the bout payload (names, styles, log, outcome, arena context).
 */
export default function BoutViewer(props: BoutViewerProps) {
  const {
    nameA,
    nameD,
    styleA,
    styleD,
    log,
    winner,
    isRivalry,
    arenaTier = 'standard',
    weather = 'Clear',
    arenaId,
  } = props;
  const {
    expanded,
    setExpanded,
    viewMode,
    onViewModeChange,
    playback,
    scoutReports,
    effectiveWeather,
    minutes,
    winnerName,
  } = useBoutViewerState({ log, winner, nameA, nameD, arenaId, weather });

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
        totalEvents={playback.totalEvents}
        visibleCount={playback.visibleCount}
        expanded={expanded}
        onToggleExpanded={() => setExpanded(!expanded)}
      />

      {expanded && (
        <BoutBody
          {...props}
          arenaTier={arenaTier}
          winnerName={winnerName}
          effectiveWeather={effectiveWeather}
          minutes={minutes}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          playback={playback}
          scoutReports={scoutReports}
        />
      )}
    </Surface>
  );
}

/** Viewer state: prefs-backed view mode, playback, weather, derived labels. */
function useBoutViewerState(props: Pick<BoutViewerProps, 'log' | 'winner' | 'nameA' | 'nameD' | 'arenaId' | 'weather'>) {
  const { log, winner, nameA, nameD, arenaId } = props;
  const { weather } = props;
  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : (weather ?? 'Clear');
  const scoutReports = useGameStore((s) => s.scoutReports);
  const arenaPrefs = useArenaPreferences();
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(arenaPrefs.defaultViewMode);
  const logEndRef = useRef<HTMLDivElement>(null);

  const playback = useBoutPlayback(log);
  const { visibleCount } = playback;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleCount]);

  const winnerName = winner === 'A' ? nameA : winner === 'D' ? nameD : null;

  const lastLogEntry = log.length > 0 ? log[log.length - 1] : null;
  const minutes = lastLogEntry ? lastLogEntry.minute : 0;

  return {
    expanded,
    setExpanded,
    viewMode,
    onViewModeChange: (mode: ViewMode) => {
      setViewMode(mode);
      // Persist as new default if user explicitly changes
      setArenaPreferences({ defaultViewMode: mode });
    },
    playback,
    scoutReports,
    effectiveWeather,
    minutes,
    winnerName,
  };
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

/** Content area: animated arena or tactical log depending on view mode. */
function ArenaOrLog(props: Pick<
  BoutBodyProps,
  | 'viewMode'
  | 'nameA'
  | 'nameD'
  | 'styleA'
  | 'styleD'
  | 'log'
  | 'winner'
  | 'arenaTier'
  | 'effectiveWeather'
  | 'arenaId'
  | 'weaponIdA'
  | 'weaponIdD'
> & {
  visibleCount: number;
  isPlaying: boolean;
  isComplete: boolean;
}) {
  const { viewMode, nameA, nameD, styleA, styleD } = props;
  const { log, winner, arenaTier, effectiveWeather, arenaId } = props;
  const { weaponIdA, weaponIdD, visibleCount, isPlaying, isComplete } = props;
  return viewMode === 'arena' ? (
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
  );
}

/** Resolution banner, analysis panel, and dev AI telemetry drawer. */
function ResolutionAndPanels(props: Pick<
  BoutBodyProps,
  | 'winner'
  | 'winnerName'
  | 'by'
  | 'minutes'
  | 'announcement'
  | 'analysis'
  | 'nameA'
  | 'nameD'
  | 'exchangeLog'
  | 'warriorA'
  | 'warriorD'
  | 'scoutReports'
> & { isComplete: boolean; totalEvents: number }) {
  const { isComplete, winner, winnerName, by, minutes } = props;
  const { totalEvents, announcement, analysis, nameA, nameD } = props;
  const { exchangeLog, warriorA, warriorD, scoutReports } = props;
  return (
    <>
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
    </>
  );
}

/** The expanded viewer body: controls, arena/log, highlights, resolution, panels. */
function BoutBody(props: BoutBodyProps) {
  const { viewMode, onViewModeChange, playback, log } = props;
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
      <ArenaOrLog
        {...props}
        visibleCount={visibleCount}
        isPlaying={isPlaying}
        isComplete={isComplete}
      />

      {/* Highlight Reel — curated notable minutes */}
      <HighlightLog log={log} visibleCount={visibleCount} />

      {/* Cinematic Resolution Banner, fallbacks, and comms link overlay */}
      <ResolutionAndPanels {...props} isComplete={isComplete} totalEvents={totalEvents} />
    </div>
  );
}
