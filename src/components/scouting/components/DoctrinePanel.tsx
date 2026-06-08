import { STYLE_DISPLAY_NAMES } from '@/types/game';

interface DoctrinePanelProps {
  stableName: string;
  styleCounts: Record<string, number>;
  activeCount: number;
  colorVariant: 'primary' | 'accent';
  textAlign?: 'left' | 'right';
}

export function DoctrinePanel({
  stableName,
  styleCounts,
  activeCount,
  colorVariant,
  textAlign = 'left',
}: DoctrinePanelProps) {
  const colorClasses = {
    primary: {
      text: 'text-primary',
      border: 'border-primary/20',
      bg: 'bg-primary/5',
      bar: 'bg-primary',
    },
    accent: {
      text: 'text-accent',
      border: 'border-accent/20',
      bg: 'bg-accent/5',
      bar: 'bg-accent',
    },
  };

  const colors = colorClasses[colorVariant];
  const alignmentClass = textAlign === 'right' ? 'text-right' : 'text-left';

  const totalFights = Object.values(styleCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`space-y-3 ${alignmentClass}`}>
      <div className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${colors.text}`}>
        {stableName}
      </div>

      <div className="space-y-2">
        {Object.entries(styleCounts)
          .sort(([, a], [, b]) => b - a) // Sort by count descending
          .map(([style, count]) => {
            const percentage = totalFights > 0 ? (count / totalFights) * 100 : 0;
            const displayName =
              STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] || style;

            return (
              <div key={style} className="flex items-center gap-3">
                {textAlign === 'right' && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-mono font-black text-foreground min-w-[3rem] text-right">
                      {count}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 min-w-[8rem] text-right">
                      {displayName}
                    </span>
                  </div>
                )}

                <div className="flex-1 max-w-[120px]">
                  <div className="h-2 bg-neutral-900 rounded-none border border-white/5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${colors.bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {textAlign === 'left' && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[9px] text-muted-foreground/60 min-w-[8rem]">
                      {displayName}
                    </span>
                    <span className="text-[10px] font-mono font-black text-foreground min-w-[3rem]">
                      {count}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div
        className={`text-[8px] text-muted-foreground/40 font-black uppercase tracking-widest ${colors.text}`}
      >
        {activeCount} Active Warriors
      </div>
    </div>
  );
}
