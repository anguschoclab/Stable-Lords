import { Activity, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/game';
import type { UseFavoritesActionsResult } from '@/hooks/useFavoritesActions';

interface BioRhythmSectionProps {
  warrior: Warrior;
  actions: Pick<
    UseFavoritesActionsResult,
    | 'handleInsight'
    | 'handleApplyRhythm'
    | 'favDisplay'
    | 'isRhythmDiscovered'
    | 'rhythmHints'
    | 'rhythmProgress'
  >;
}

/**
 *
 */
export function BioRhythmSection({ warrior, actions }: BioRhythmSectionProps) {
  const {
    handleInsight,
    handleApplyRhythm,
    favDisplay,
    isRhythmDiscovered,
    rhythmHints,
    rhythmProgress,
  } = actions;

  const fav = warrior.favorites;
  const plan = warrior.plan;
  const alreadyApplied =
    fav?.discovered.rhythm && plan && plan.OE === fav.rhythm.oe && plan.AL === fav.rhythm.al;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
          <Activity className="h-3 w-3" /> Bio-Rhythm
        </div>
        {isRhythmDiscovered && (
          <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
            OPTIMIZED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isRhythmDiscovered ? (
            <div className="space-y-1">
              <div className="text-sm font-display font-black uppercase">{favDisplay.rhythm}</div>
              <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                Combat Bonus: +2 INI / +2 DEF
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-black italic">
              {rhythmHints > 0 ? favDisplay.rhythmHint : 'Unknown'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRhythmDiscovered &&
            (alreadyApplied ? (
              <span className="text-[8px] font-black uppercase text-primary tracking-widest px-2 py-0.5 border border-primary/20 bg-primary/5">
                ACTIVE
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyRhythm}
                className="h-8 px-4 border-arena-gold/20 hover:bg-arena-gold/10 text-arena-gold text-[9px] font-black uppercase rounded-none tracking-widest"
              >
                Sync
              </Button>
            ))}
          {!isRhythmDiscovered && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInsight('rhythm')}
              className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 rounded-none"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            isRhythmDiscovered
              ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]'
              : 'bg-white/10'
          )}
          style={{ width: `${rhythmProgress}%` }}
        />
      </div>
    </div>
  );
}
