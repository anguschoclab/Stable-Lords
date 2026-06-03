import { Button } from '@/components/ui/button';

interface DeathModalFooterProps {
  onAcknowledge: () => void;
}

/**
 * Death modal footer section with acknowledge button.
 */
export function DeathModalFooter({ onAcknowledge }: DeathModalFooterProps) {
  return (
    <footer className="pt-4 flex flex-col items-center gap-4 border-t border-white/5">
      <Button onClick={onAcknowledge}>MEMORIALIZE & CONTINUE</Button>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
        "Even the strongest steel returns to the earth"
      </p>
    </footer>
  );
}
