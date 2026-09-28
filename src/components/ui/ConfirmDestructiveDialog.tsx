import type { CSSProperties, ReactNode } from 'react';
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

interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onConfirm: () => void;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  titleClassName?: string;
  descriptionClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
  descriptionId?: string;
}

/** Shared destructive-action confirmation dialog (erase save, relinquish crown, reset ledger). */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  contentClassName,
  contentStyle,
  titleClassName,
  descriptionClassName,
  cancelClassName,
  confirmClassName,
  descriptionId,
}: ConfirmDestructiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={contentClassName} style={contentStyle} aria-describedby={descriptionId}>
        <AlertDialogHeader>
          <AlertDialogTitle className={titleClassName}>{title}</AlertDialogTitle>
          <AlertDialogDescription id={descriptionId} className={descriptionClassName ?? 'text-muted-foreground font-medium'}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            className={
              cancelClassName ??
              'bg-secondary/40 border-white/5 hover:bg-white/10 hover:text-foreground'
            }
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              confirmClassName ??
              'bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase text-[11px] tracking-widest'
            }
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
