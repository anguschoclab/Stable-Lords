import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankStripProps {
  rankIndex: number;
}

export function RankStrip({ rankIndex }: RankStripProps) {
  return (
    <div
      className={cn(
        'w-full md:w-20 shrink-0 flex flex-row md:flex-col items-center justify-center p-4 md:p-0 gap-4 border-b md:border-b-0 md:border-r border-white/5 relative',
        rankIndex === 0 ? 'bg-arena-gold/5' : rankIndex === 1 ? 'bg-primary/5' : 'bg-white/2'
      )}
    >
      <div className="absolute top-0 left-0 w-full md:w-1 h-1 md:h-full bg-primary opacity-40 group-hover:opacity-100 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-500" />
      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 md:mb-1">
        RANK
      </span>
      <span
        className={cn(
          'text-4xl font-display font-black tracking-tighter leading-none',
          rankIndex === 0
            ? 'text-arena-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]'
            : rankIndex === 1
              ? 'text-primary'
              : 'text-muted-foreground/40'
        )}
      >
        {rankIndex + 1}
      </span>
      {rankIndex === 0 && <Crown className="h-4 w-4 mt-1 text-arena-gold animate-bounce" />}
    </div>
  );
}
