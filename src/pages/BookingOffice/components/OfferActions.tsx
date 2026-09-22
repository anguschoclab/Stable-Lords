import { Button } from '@/components/ui/button';
import { CheckCircle2, Ban } from 'lucide-react';

interface OfferActionsProps {
  isSigned: boolean;
  acceptDisabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Offer card footer: signed banner, or accept/decline actions.
 */
export function OfferActions({ isSigned, acceptDisabled, onAccept, onDecline }: OfferActionsProps) {
  return (
    <div className="p-4 bg-white/[0.02] flex gap-2">
      {isSigned ? (
        <div className="flex-1 h-12 flex items-center justify-center gap-3 border border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
          <CheckCircle2 className="h-4 w-4" /> Offer Accepted
        </div>
      ) : (
        <>
          <Button
            className="flex-1 h-12 bg-primary text-primary-foreground rounded-none gap-3 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/90 transition-all"
            onClick={onAccept}
            disabled={acceptDisabled}
          >
            Accept Offer
          </Button>
          <Button
            variant="outline"
            className="w-12 h-12 rounded-none border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 p-0 transition-all"
            onClick={onDecline}
          >
            <Ban className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
