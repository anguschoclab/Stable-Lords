import { cn } from '@/lib/utils';

interface ConnectionLinesProps {
  rIdx: number;
  isBye: boolean;
  isPending: boolean;
  bronze: boolean;
}

export function ConnectionLines({ rIdx, isBye, isPending, bronze }: ConnectionLinesProps) {
  if (rIdx === 0) return null;

  if (isBye) {
    return (
      <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-8 pointer-events-none stroke-border/10 fill-none overflow-visible">
        <path d="M 0 0 L 48 0" className="stroke-1" />
      </svg>
    );
  }

  return (
    <svg
      className={cn(
        'absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none fill-none overflow-visible',
        isPending ? 'stroke-border/10' : 'stroke-primary/30',
        bronze && 'stroke-amber-500/30'
      )}
    >
      <path d="M 0 -12 L 24 -12 L 24 0 L 48 0" className="stroke-1" />
      <path d="M 0 12 L 24 12 L 24 0 L 48 0" className="stroke-1" />
    </svg>
  );
}
