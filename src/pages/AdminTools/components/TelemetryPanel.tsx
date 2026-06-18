import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Activity } from 'lucide-react';

interface TelemetryPanelProps {
  week: number;
  season: string;
  treasury: number;
  fame: number;
  rosterSize: number;
  player: Record<string, unknown>;
}

export function TelemetryPanel({
  week,
  season,
  treasury,
  fame,
  rosterSize,
  player,
}: TelemetryPanelProps) {
  return (
    <div className="space-y-12">
      <SectionDivider label="Data Visualization" />
      <Surface variant="glass" className="border-white/5 overflow-hidden font-mono text-[11px]">
        <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4 text-muted-foreground/40 uppercase font-black tracking-widest">
          <Activity className="h-4 w-4" /> Protocol Dump // V2.4.0
        </div>
        <div className="p-8 bg-black/40 overflow-x-auto thin-scrollbar">
          <pre className="text-primary/60">
            {JSON.stringify(
              {
                temporal: { week, season },
                inventory: { treasury, fame },
                roster: { size: rosterSize },
                player: player,
              },
              null,
              4
            )}
          </pre>
        </div>
      </Surface>
    </div>
  );
}
