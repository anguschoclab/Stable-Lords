import { Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Warrior } from '@/types/game';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { getMastery } from '@/engine/stylePassives';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';

interface MasterySectionProps {
  warrior?: Warrior;
}

/** Shows the warrior's style-mastery tier from career fights. */
export default function MasterySection({ warrior }: MasterySectionProps) {
  const totalFights = warrior ? fightEquivalentsOf(warrior) : 0;
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
