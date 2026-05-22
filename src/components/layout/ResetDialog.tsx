import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}/**
 * Reset dialog.
 * @param { open, onOpenChange, onConfirm } - { open, on open change, on confirm }.
 * @returns The result.
 */


/**
 * Reset dialog.
 * @param { open, onOpenChange, onConfirm } - { open, on open change, on confirm }.
 * @returns The result.
 */
export function ResetDialog({ open, onOpenChange, onConfirm }: ResetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-neutral-900 border-destructive/20 scale-105">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display font-black text-2xl uppercase tracking-tighter text-destructive">
            Expunge the Record
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium selection:bg-destructive/20">
            You are about to seal and destroy this ledger. All combat history, stable roster, and
            financial records will be permanently struck from the archive.
            <br />
            <br />
            <span className="text-destructive font-black uppercase tracking-widest text-[10px]">
              This act cannot be undone. Proceed?
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="bg-secondary/40 border-white/5 hover:bg-white/10 hover:text-foreground">
            Preserve the Record
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.3)]"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Expunge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
