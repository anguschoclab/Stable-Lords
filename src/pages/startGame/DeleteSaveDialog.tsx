import { ConfirmDestructiveDialog } from '@/components/ui/ConfirmDestructiveDialog';
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
    <ConfirmDestructiveDialog
      open={!!deleteTarget}
      onOpenChange={onClose}
      title="Erase this Record?"
      descriptionClassName="text-muted-foreground text-sm"
      description={
        <>
          The save for <strong className="text-foreground">{deleteTarget?.name}</strong> will be
          permanently deleted. This cannot be undone.
        </>
      }
      cancelLabel="Preserve"
      confirmLabel="Expunge Record"
      onConfirm={onDelete}
      contentStyle={{
        background: '#150F08',
        border: '1px solid rgba(60,42,22,0.9)',
        borderTopColor: 'rgba(100,70,36,0.5)',
      }}
      titleClassName="font-display text-lg"
      cancelClassName="border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
    />
  );
}
