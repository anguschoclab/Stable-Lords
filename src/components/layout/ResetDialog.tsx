import { ConfirmDestructiveDialog } from '@/components/ui/ConfirmDestructiveDialog';

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Reset dialog.
 * @param - { open, on open change, on confirm }.
 */
export function ResetDialog({ open, onOpenChange, onConfirm }: ResetDialogProps) {
  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Expunge the Record"
      descriptionId="reset-dialog-description"
      descriptionClassName="text-muted-foreground font-medium selection:bg-destructive/20"
      description={
        <>
          You are about to seal and destroy this ledger. All combat history, stable roster, and
          financial records will be permanently struck from the archive.
          <br />
          <br />
          <span className="text-destructive font-black uppercase tracking-widest text-[10px]">
            This act cannot be undone. Proceed?
          </span>
        </>
      }
      cancelLabel="Preserve the Record"
      confirmLabel="Expunge"
      onConfirm={onConfirm}
      contentClassName="bg-neutral-900 border-destructive/20 scale-105"
      titleClassName="font-display font-black text-2xl uppercase tracking-tighter text-destructive"
      confirmClassName="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase text-[11px] tracking-widest shadow-[0_0_20px_hsl(var(--destructive)/0.3)]"
    />
  );
}
