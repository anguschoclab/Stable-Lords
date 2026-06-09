import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface EncumbranceBarProps {
  totalWeight: number;
  carryCap: number;
  overEncumbered: boolean;
}

/**
 *
 */
export function EncumbranceBar({ totalWeight, carryCap, overEncumbered }: EncumbranceBarProps) {
  const encPct = Math.min(100, (totalWeight / Math.max(1, carryCap)) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Encumbrance</span>
        <span className={`font-mono font-semibold ${overEncumbered ? 'text-destructive' : ''}`}>
          {totalWeight} / {carryCap}
        </span>
      </div>
      <Progress
        value={encPct}
        className={`h-2.5 ${overEncumbered ? '[&>div]:bg-destructive' : ''}`}
      />
      {overEncumbered && (
        <div className="space-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            Over-encumbered! Combat penalties apply:
          </div>
          <div className="grid grid-cols-2 gap-2 pl-5 text-[10px] font-mono">
            <div className="bg-destructive/10 text-destructive p-1 rounded-none border border-destructive/20 text-center">
              -2 Initiative
            </div>
            <div className="bg-destructive/10 text-destructive p-1 rounded-none border border-destructive/20 text-center">
              +20% END Cost
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
