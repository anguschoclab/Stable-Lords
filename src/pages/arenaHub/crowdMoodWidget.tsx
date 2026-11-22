import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import {
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  getMoodModifiers,
  type CrowdMood,
} from '@/engine/bout/crowdMood';
import { MOOD_CELL_CLASS, MOOD_TRAIL_MIN, buildMoodTrail } from './moodTrail';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';

/**
 * Crowd mood widget.
 */
export function CrowdMoodWidget() {
  const crowdMood = useGameStore((s) => s.crowdMood);
  const mood = crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Surface
      variant="glass"
      className="flex items-center gap-8 p-5 border-l-4 border-l-accent/50 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none"
    >
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {MOOD_ICONS[mood]}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">
              Crowd Temperament
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight max-w-[200px] mt-1">
            {MOOD_DESCRIPTIONS[mood]}
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-white/5 shrink-0" />

      <div className="flex items-center gap-6 overflow-x-auto thin-scrollbar">
        <MoodStat
          label="Fame Mult"
          value={`×${mods.fameMultiplier.toFixed(1)}`}
          highlight={mods.fameMultiplier > 1 ? 'text-primary' : 'text-muted-foreground'}
          tooltip="Multiplies all fame gains from this week's bouts."
        />
        <MoodStat
          label="Lethality"
          value={`${mods.killChanceBonus > 0 ? '+' : ''}${(mods.killChanceBonus * 100).toFixed(0)}%`}
          highlight={mods.killChanceBonus > 0 ? 'text-destructive' : 'text-muted-foreground'}
          tooltip="Probability bonus added to all fatal blow checks."
        />
      </div>

      <MoodTrail />

      <Badge
        variant="outline"
        className="ml-auto border-accent/40 bg-accent/5 text-accent text-[9px] font-black tracking-widest shrink-0"
      >
        {mood.toUpperCase()}
      </Badge>
    </Surface>
  );
}

/**
 * Temperament ledger — one cell per resolved week (oldest → newest; the
 * rightmost, ringed cell is the current mood). Answers "is this week's
 * crowd a streak or a blip?" — a Bloodthirsty run sustains elevated kill
 * chance, a Festive run is a fame window. Thin-data weeks render an
 * honest forming cue rather than a one-cell fake trend.
 */
function MoodTrail() {
  const moodHistory = useGameStore((s) => s.moodHistory);
  const trail = useMemo(() => buildMoodTrail(moodHistory), [moodHistory]);

  return (
    <div className="flex items-center gap-6 shrink-0">
      <div className="h-10 w-px bg-white/5 shrink-0" />
      <div>
        <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1.5">
          Temperament Ledger
        </div>
        {trail.length >= MOOD_TRAIL_MIN ? (
          <div
            className="flex items-center gap-[3px]"
            role="list"
            aria-label="Crowd mood by week, oldest to newest"
          >
            {trail.map((e, i) => (
              <Tooltip key={`${e.week}-${i}`}>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    role="listitem"
                    aria-label={`Week ${e.week}: ${e.mood}`}
                    className={cn(
                      'w-2.5 h-4 transition-transform hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                      MOOD_CELL_CLASS[e.mood],
                      i === trail.length - 1 && 'ring-1 ring-foreground/50'
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-[11px]">
                    <p className="font-bold">
                      Week {e.week}: {e.mood}
                    </p>
                    {i === trail.length - 1 && (
                      <p className="text-muted-foreground">Current temperament</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : (
          <p className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest">
            Ledger forms after two resolved weeks
          </p>
        )}
      </div>
    </div>
  );
}

/** One mood-modifier stat tile with explanatory tooltip. */
function MoodStat({
  label,
  value,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  highlight: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05] motion-reduce:transition-none">
          <div className="text-right">
            <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
              {label}
            </div>
            <div
              className={cn(
                'text-lg font-display font-black tracking-tighter leading-none',
                highlight
              )}
            >
              {value}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
