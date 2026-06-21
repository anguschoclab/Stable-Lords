import { cn } from '@/lib/utils';

interface FighterBarsProps {
  hpPercent: number;
  fpPercent: number;
  isWinner?: boolean;
}

/**
 *
 */
export function FighterBars({ hpPercent, fpPercent, isWinner }: FighterBarsProps) {
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24">
      <div className="h-1.5 bg-black/50 rounded-none mb-0.5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            hpPercent > 50 ? 'bg-primary' : hpPercent > 25 ? 'bg-arena-gold' : 'bg-destructive'
          )}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="h-1 bg-black/50 rounded-none overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${fpPercent}%` }}
        />
      </div>
      {isWinner && <div className="absolute -inset-1 bg-arena-gold/30 blur-sm animate-pulse" />}
    </div>
  );
}
