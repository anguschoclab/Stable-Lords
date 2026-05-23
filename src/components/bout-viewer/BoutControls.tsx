import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { ViewModeToggle, type ViewMode } from '@/components/arena';

interface BoutControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isPlaying: boolean;
  speed: 1 | 2 | 3;
  setSpeed: (speed: 1 | 2 | 3) => void;
  visibleCount: number;
  totalEvents: number;
  onReset: () => void;
  onTogglePlay: () => void;
  onSkipToEnd: () => void;
}/**
  * Bout controls.
  * @param  - {
  view mode,
  on view mode change,
  is playing,
  speed,
  set speed,
  visible count,
  total events,
  on reset,
  on toggle play,
  on skip to end,
}.
  * @returns The result.
  */


/**
 * Bout controls.
 * @param  - {
  view mode,
  on view mode change,
  is playing,
  speed,
  set speed,
  visible count,
  total events,
  on reset,
  on toggle play,
  on skip to end,
}.
 * @returns The result.
 */
export default function BoutControls({
  viewMode,
  onViewModeChange,
  isPlaying,
  speed,
  setSpeed,
  visibleCount,
  totalEvents,
  onReset,
  onTogglePlay,
  onSkipToEnd,
}: BoutControlsProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-neutral-900/60 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        <ViewModeToggle mode={viewMode} onChange={onViewModeChange} disabled={isPlaying} />

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center px-4 py-2 rounded-none bg-black border border-white/5 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onReset} aria-label="Reset bout viewer">
                <RotateCcw className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest">
              RESET BUFFER
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={onTogglePlay}
            className={cn(
              'flex items-center justify-center p-2.5 rounded-full transition-all active:scale-95 group/play',
              isPlaying
                ? 'bg-foreground/10 text-foreground'
                : 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]'
            )}
            aria-label={isPlaying ? 'Pause playback' : 'Play bout'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5 fill-current" />
            )}
          </button>

          <div className="h-4 w-px bg-white/10" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onSkipToEnd} aria-label="Skip to end of bout">
                <SkipForward className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest">
              SKIP TO RESOLVE
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center bg-black border border-white/5 rounded-none p-1">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s as 1 | 2 | 3)}
              className={cn(
                'px-4 py-1.5 rounded-none text-[10px] font-mono font-black transition-all',
                speed === s
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground/20 hover:text-muted-foreground/60'
              )}
              aria-label={`Set playback speed to ${s}x`}
              aria-pressed={speed === s}
            >
              {s}X
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-mono text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
          <div className="p-1 px-2 rounded-none bg-neutral-950 border border-white/5 text-primary">
            {visibleCount}
          </div>
          <span className="opacity-20 text-xs">/</span>
          <div className="p-1 px-2 rounded-none bg-neutral-950 border border-white/5">
            {totalEvents}
          </div>
          ENTRIES
        </div>
      </div>
    </div>
  );
}
