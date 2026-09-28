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
import type { SaveSlotMeta } from '@/state/saveSlots';

/** Confirmation dialog for permanently deleting a save slot. */
export function DeleteSaveDialog({
  deleteTarget,
  onClose,
  onDelete,
}: {
  deleteTarget: SaveSlotMeta | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <AlertDialog open={!!deleteTarget} onOpenChange={onClose}>
      <AlertDialogContent
        style={{
          background: '#150F08',
          border: '1px solid rgba(60,42,22,0.9)',
          borderTopColor: 'rgba(100,70,36,0.5)',
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg">Erase this Record?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            The save for <strong className="text-foreground">{deleteTarget?.name}</strong> will be
            permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground">
            Preserve
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Expunge Record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
