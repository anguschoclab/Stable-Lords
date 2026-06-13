import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Download, Upload, Trash2 } from 'lucide-react';

interface SystemPanelProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export function SystemPanel({ onExport, onImport, onReset }: SystemPanelProps) {
  return (
    <div className="space-y-12">
      <SectionDivider label="Save Operations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
            <ImperialRing size="sm" variant="bronze">
              <Download className="h-3 w-3 text-muted-foreground" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              Save Core
            </span>
          </div>
          <div className="p-8 space-y-4">
            <Button
              onClick={onExport}
              className="w-full h-12 gap-3 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
              variant="outline"
            >
              Export Persistent Save
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Button
                className="w-full h-12 gap-3 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
                variant="outline"
              >
                <Upload className="h-4 w-4" /> Import State Data
              </Button>
            </div>
          </div>
        </Surface>

        <Surface variant="blood" className="border-primary/20 overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-4">
            <ImperialRing size="sm" variant="blood">
              <Trash2 className="h-3 w-3 text-primary" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Destructive Reset
            </span>
          </div>
          <div className="p-8 space-y-6">
            <p className="text-[10px] text-primary/60 font-mono leading-relaxed">
              WARNING: This bypasses all safety checks and nukes the local IndexedDB pool.
              All progress will be lost.
            </p>
            <Button
              onClick={onReset}
              variant="destructive"
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
            >
              Execute System Wipe
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
