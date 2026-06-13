import { Surface } from '@/components/ui/Surface';
import { ScrollText } from 'lucide-react';

interface SeasonDeclarationsProps {
  seasonGazette: string[];
}

export function SeasonDeclarations({ seasonGazette }: SeasonDeclarationsProps) {
  if (seasonGazette.length === 0) return null;

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-primary/10 border border-primary/20">
          <ScrollText className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          Season Declarations
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {seasonGazette.slice(0, 12).map((item, i) => (
          <div
            key={`${item.slice(0, 40)}-${i}`}
            className="px-3 py-2 bg-white/[0.02] border border-white/5 text-[10px] text-foreground/70 italic leading-snug"
          >
            {item}
          </div>
        ))}
      </div>
    </Surface>
  );
}
