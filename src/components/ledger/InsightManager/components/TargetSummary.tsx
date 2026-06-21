import { Button } from '@/components/ui/button';
import { Zap, RotateCw, AlertCircle } from 'lucide-react';

interface TargetSummaryProps {
  warrior: { name: string } | null;
  canReveal: boolean;
  isRevealing: boolean;
  onReveal: () => void;
}

/**
 *
 */
export function TargetSummary({ warrior, canReveal, isRevealing, onReveal }: TargetSummaryProps) {
  return (
    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-primary/5">
          {warrior ? (
            <div className="text-[10px] font-black text-primary uppercase">
              {warrior.name.slice(0, 2)}
            </div>
          ) : (
            <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
        <div>
          <p>{warrior?.name || 'Target Required'}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
            Ready to Reveal
          </p>
        </div>
      </div>

      <Button
        disabled={!canReveal || isRevealing}
        onClick={onReveal}
        className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.2)] group"
      >
        {isRevealing ? (
          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Zap className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
        )}
        {isRevealing ? 'CONSULTING ORACLES...' : 'SEQUENCE START'}
      </Button>
    </div>
  );
}
