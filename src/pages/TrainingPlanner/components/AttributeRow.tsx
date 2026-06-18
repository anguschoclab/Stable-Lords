import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { ATTRIBUTE_LABELS } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

interface AttributeRowProps {
  attr: {
    key: keyof Attributes;
    val: number;
    pot?: number;
    chance: number;
    seasonGain: number;
    capped: boolean;
    seasonCapped: boolean;
    drFactor: number;
  };
}

export function AttributeRow({ attr }: AttributeRowProps) {
  const chancePct = Math.round(attr.chance * 100);
  const isRecommended = !attr.capped && !attr.seasonCapped && attr.chance >= 0.4;
  const pct = (attr.val / 25) * 100;
  const potPct = attr.pot ? (attr.pot / 25) * 100 : 0;

  const colorClass =
    attr.val >= 16 ? 'bg-primary' : attr.val >= 12 ? 'bg-arena-gold' : 'bg-white/20';

  return (
    <div
      className={cn(
        'p-4 border border-white/5 bg-white/[0.01] transition-all',
        attr.capped && 'opacity-20 grayscale'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 w-16">
            {ATTRIBUTE_LABELS[attr.key]}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-black text-foreground leading-none">
              {attr.val}
            </span>
            {attr.pot !== undefined && (
              <span className="text-[11px] font-display font-black text-arena-gold opacity-40">
                / {attr.pot}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn('w-2 h-2', i < attr.seasonGain ? 'bg-primary' : 'bg-white/5')}
              />
            ))}
          </div>
          {!attr.capped ? (
            <div className="w-16 text-right">
              <span
                className={cn(
                  'text-[10px] font-display font-black tracking-widest',
                  chancePct >= 50
                    ? 'text-arena-pop'
                    : chancePct >= 30
                      ? 'text-foreground'
                      : 'text-primary'
                )}
              >
                {chancePct}%
              </span>
              <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                SUCCESS
              </p>
            </div>
          ) : (
            <div className="w-16 text-right">
              <span className="text-[10px] font-display font-black text-muted-foreground/40 tracking-widest">
                CEILING
              </span>
              <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                REACHED
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-1 bg-white/5 relative overflow-hidden">
        {attr.pot !== undefined && (
          <div
            className="absolute h-full w-px bg-arena-gold/30 z-10"
            style={{ left: `${potPct}%` }}
          />
        )}
        <div
          className={cn('h-full transition-all duration-1000', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isRecommended && (
        <div className="flex items-center gap-2 mt-3">
          <Target className="h-3 w-3 text-arena-pop" />
          <span className="text-[8px] font-black uppercase tracking-widest text-arena-pop">
            Optimized Development Path Detected
          </span>
        </div>
      )}
    </div>
  );
}
