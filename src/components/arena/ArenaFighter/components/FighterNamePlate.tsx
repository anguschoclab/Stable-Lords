import { cn } from '@/lib/utils';

interface FighterNamePlateProps {
  name: string;
  isWinner?: boolean;
}

export function FighterNamePlate({ name, isWinner }: FighterNamePlateProps) {
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
      <span
        className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-none',
          isWinner ? 'bg-arena-gold/80 text-primary-foreground' : 'bg-black/60 text-foreground/90'
        )}
      >
        {name}
      </span>
    </div>
  );
}
