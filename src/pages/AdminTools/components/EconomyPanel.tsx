import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Zap } from 'lucide-react';

interface EconomyPanelProps {
  onForceMastery: () => void;
  onResetRivals: () => void;
}

export function EconomyPanel({ onForceMastery, onResetRivals }: EconomyPanelProps) {
  return (
    <div className="space-y-12">
      <SectionDivider label="Operational Mastery" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
            <ImperialRing size="sm" variant="gold">
              <Zap className="h-3 w-3 text-arena-gold" />
            </ImperialRing>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              God Mode Tools
            </span>
          </div>
          <div className="p-8 space-y-4">
            <Button
              onClick={onForceMastery}
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-arena-gold/30 text-arena-gold"
              variant="outline"
            >
              Force All Mastery
            </Button>
            <Button
              onClick={onResetRivals}
              className="w-full h-12 font-black uppercase text-[10px] tracking-widest rounded-none border-primary/30 text-primary"
              variant="outline"
            >
              Regenerate Rival Stables
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
