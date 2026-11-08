import { BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/game';
import type { UseFavoritesActionsResult } from '@/hooks/useFavoritesActions';
import {
  LEARN_SKILL_KEYS,
  favoriteLearnOf,
  learnsTotal,
  suspectedFavoriteLearn,
} from '@/engine/learning';
import { LEARN_CAREER_CAP, LEARN_SKILL_NAMES } from '@/constants/combat/combat/learn';

interface LearnAffinitySectionProps {
  warrior: Warrior;
  actions: Pick<
    UseFavoritesActionsResult,
    'handleInsight' | 'isLearnDiscovered' | 'learnHints' | 'learnProgress'
  >;
}

/**
 * Learn affinity — the hidden "favorite learn" that lessons stick to fastest,
 * plus the per-skill lesson ledger the warrior has banked. The favorite is only
 * named when discovered; a banked skill at 3+ is flagged "Suspected" until then.
 */
export function LearnAffinitySection({ warrior, actions }: LearnAffinitySectionProps) {
  const { handleInsight, isLearnDiscovered, learnHints, learnProgress } = actions;

  const learned = warrior.learnedSkills ?? {};
  const total = learnsTotal(warrior);
  const suspected = suspectedFavoriteLearn(warrior);
  const discovered = isLearnDiscovered ? favoriteLearnOf(warrior) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-2">
          <BookOpen className="h-3 w-3" /> Favorite Learn
        </div>
        {isLearnDiscovered && (
          <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
            ATTUNED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isLearnDiscovered && discovered ? (
            <div className="space-y-1">
              <div className="text-sm font-display font-black uppercase">
                {LEARN_SKILL_NAMES[discovered] ?? discovered}
              </div>
              <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                Lessons in this art stick fastest
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-black italic">
              {suspected
                ? `Suspected: ${LEARN_SKILL_NAMES[suspected] ?? suspected}`
                : learnHints > 0
                  ? 'A pattern is emerging'
                  : 'Unknown'}
            </div>
          )}
        </div>
        {!isLearnDiscovered && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInsight('learn')}
            className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 rounded-none"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all motion-reduce:transition-none motion-reduce:transform-none duration-1000',
            isLearnDiscovered
              ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]'
              : 'bg-white/10'
          )}
          style={{ width: `${learnProgress}%` }}
        />
      </div>

      {total > 0 && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
              Lessons Banked
            </span>
            <span className="text-[8px] font-black tabular-nums text-muted-foreground/60">
              {total} / {LEARN_CAREER_CAP}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-1">
            {LEARN_SKILL_KEYS.filter((k) => (learned[k] ?? 0) > 0).map((k) => (
              <div key={k} className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
                  {LEARN_SKILL_NAMES[k] ?? k}
                </span>
                <span className="text-[10px] font-black tabular-nums text-foreground">
                  {learned[k]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
