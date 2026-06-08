import { Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Warrior } from '@/types/game';
import { getMastery } from '@/engine/stylePassives';

interface MasterySectionProps {
  warrior?: Warrior;
}

export default function MasterySection({ warrior }: MasterySectionProps) {
  const totalFights = (warrior?.career?.wins || 0) + (warrior?.career?.losses || 0);
  const mastery = getMastery(totalFights);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Gauge className="w-3 h-3" />
        <span>Mastery</span>
      </div>
      <div className="flex items-center gap-4 text-[9px]">
        <span className="text-muted-foreground/60">Fights: {totalFights}</span>
        <Badge className="rounded-none border-none font-black text-[9px] uppercase px-2 py-0.5 bg-arena-gold text-primary-foreground">
          {mastery.tier}
        </Badge>
      </div>
    </div>
  );
}
