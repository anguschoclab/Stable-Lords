import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  reviewWarriorDesign,
  type DesignVerdict,
} from '@/engine/warrior/designReview';
import type { Attributes, FightingStyle } from '@/types/game';

interface DesignReviewCardProps {
  attrs: Attributes;
  style: FightingStyle;
}

const VERDICT_DOT: Record<DesignVerdict, string> = {
  good: 'bg-arena-gold',
  ok: 'bg-primary',
  info: 'bg-muted-foreground/60',
  warn: 'bg-destructive',
};

const VERDICT_TEXT: Record<DesignVerdict, string> = {
  good: 'text-arena-gold',
  ok: 'text-primary',
  info: 'text-muted-foreground',
  warn: 'text-destructive',
};

/**
 * Live design review — scores the current build against the Arena-93
 * "How to Build a Better Warrior" design axes while the sliders move.
 */
export function DesignReviewCard({ attrs, style }: DesignReviewCardProps) {
  const items = useMemo(() => reviewWarriorDesign(attrs, style), [attrs, style]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Design Review</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={`${item.axis}-${item.title}-${i}`} className="flex gap-2.5">
              <span
                className={cn('mt-1.5 h-1.5 w-1.5 shrink-0', VERDICT_DOT[item.verdict])}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest',
                    VERDICT_TEXT[item.verdict]
                  )}
                >
                  {item.title}
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
