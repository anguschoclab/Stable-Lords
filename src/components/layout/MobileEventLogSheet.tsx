import EventLog from '@/components/EventLog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MobileEventLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mobile presentation for the global event context: a sheet, not a fixed rail. */
export function MobileEventLogSheet({ open, onOpenChange }: MobileEventLogSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md border-l border-border bg-background p-0 sm:w-96"
        aria-label="Arena Feed"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Arena Feed</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <EventLog />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
