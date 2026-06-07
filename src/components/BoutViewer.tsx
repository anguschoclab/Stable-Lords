import { useState, useEffect, useRef } from 'react';
import type { MinuteEvent, FightOutcomeBy, FightingStyle } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { useBoutPlayback } from '@/hooks/useBoutPlayback';
import { useGameStore } from '@/state/useGameStore';
import ArenaView from './arena/ArenaView';
import TacticalLogView from './arena/TacticalLogView';
import HighlightLog from './arena/HighlightLog';
import type { ViewMode } from './arena/ViewModeToggle';
import { isIndoorArena } from '@/data/arenas';

import BoutHeader from './bout-viewer/BoutHeader';
import BoutControls from './bout-viewer/BoutControls';
import BoutResolution from './bout-viewer/BoutResolution';

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
} /**
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
  * @returns The result.
  */

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
 * @returns The result.
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
}: BoutViewerProps) {
  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : weather;
  const store = useGameStore();
  const arenaPrefs = store.arenaPreferences;
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(arenaPrefs.defaultViewMode);
  const logEndRef = useRef<HTMLDivElement>(null);

  const {
    visibleCount,
    isPlaying,
    speed,
    setSpeed,
    isComplete,
    totalEvents,
    reset,
    skipToEnd,
    togglePlay,
  } = useBoutPlayback(log);

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
        <div className="animate-in fade-in slide-in-from-top-2 duration-700">
          {/* Simulation Controls */}
          <BoutControls
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              // Persist as new default if user explicitly changes
              store.setArenaPreferences({ defaultViewMode: mode });
            }}
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
        </div>
      )}
    </Surface>
  );
}
