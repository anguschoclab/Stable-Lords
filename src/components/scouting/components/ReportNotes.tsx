import { Surface } from '@/components/ui/Surface';

interface ReportNotesProps {
  notes: string;
}

/**
 *
 */
export function ReportNotes({ notes }: ReportNotesProps) {
  return (
    <Surface variant="glass" className="bg-black/40 border-border/20 p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            FIELD OBSERVATIONS
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{notes}</p>
      </div>
    </Surface>
  );
}
