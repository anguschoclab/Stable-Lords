import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { FastForward } from 'lucide-react';

interface WorldPanelProps {
  onSkipWeek: () => void;
  onSkipSeason: () => void;
  onSkipFTUE: () => void;
}

/**
 *
 */
export function WorldPanel({ onSkipWeek, onSkipSeason, onSkipFTUE }: WorldPanelProps) {
  return (
    <div className="space-y-12">
      <SectionDivider label="Temporal Control" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
            <ImperialRing size="sm" variant="gold">
              <FastForward className="h-3 w-3 text-arena-gold" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              Time Dilation
            </span>
          </div>
          <div className="p-8 space-y-4">
            <Button
              onClick={onSkipWeek}
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
              variant="secondary"
            >
              Advance 1 Week
            </Button>
            <Button
              onClick={onSkipSeason}
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none"
              variant="secondary"
            >
              Advance Season (13W)
            </Button>
            <Button
              onClick={onSkipFTUE}
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10"
              variant="outline"
            >
              Bypass FTUE Constraints
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
