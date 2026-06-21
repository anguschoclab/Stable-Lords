import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { getMetaLabel, getMetaColor } from '@/engine/metaDrift';
import { TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface StyleOfTheSeasonProps {
  metaEntries: Array<[string, number]>;
  topStyle: [string, number] | null;
}

/**
 *
 */
export function StyleOfTheSeason({ metaEntries, topStyle }: StyleOfTheSeasonProps) {
  return (
    <Surface variant="glass" padding="none" className="border-accent/10 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-accent/5 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-accent/10 border border-accent/20">
          <TrendingUp className="h-3.5 w-3.5 text-accent" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
          Style of the Season
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {topStyle ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-black uppercase tracking-tight text-foreground/80">
                {STYLE_DISPLAY_NAMES[topStyle[0] as keyof typeof STYLE_DISPLAY_NAMES] ??
                  topStyle[0]}
              </span>
              <span
                className={cn(
                  'text-[11px] font-black flex items-center',
                  getMetaColor(topStyle[1])
                )}
              >
                {topStyle[1] > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownLeft className="h-3 w-3 mr-0.5" />
                )}
                {getMetaLabel(topStyle[1])}
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {metaEntries.slice(0, 5).map(([style, drift]) => (
                <div key={style} className="flex items-center justify-between text-[9px]">
                  <span className="text-muted-foreground/60 font-black uppercase tracking-widest">
                    {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                  </span>
                  <span className={cn('font-mono font-black', getMetaColor(drift))}>
                    {drift > 0 ? '+' : ''}
                    {drift.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center uppercase tracking-widest">
            Insufficient data
          </p>
        )}
      </div>
    </Surface>
  );
}
