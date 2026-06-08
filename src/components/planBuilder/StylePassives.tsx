import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { BookOpen } from 'lucide-react';
import type { FightPlan, Warrior } from '@/types/game';
import TempoSection from './TempoSection';
import MasterySection from './MasterySection';
import KillMechanicsSection from './KillMechanicsSection';
import AntiSynergySection from './AntiSynergySection';

interface StylePassivesProps {
  plan: FightPlan;
  warrior?: Warrior;
}

export default function StylePassives({ plan, warrior }: StylePassivesProps) {
  const [showStylePassives, setShowStylePassives] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
            Style Passives
          </span>
        </div>
        <Switch checked={showStylePassives} onCheckedChange={setShowStylePassives} />
      </div>

      {showStylePassives && (
        <div className="bg-black/40 border border-white/5 p-4 space-y-4">
          <TempoSection plan={plan} />
          <MasterySection warrior={warrior} />
          <KillMechanicsSection plan={plan} />
          <AntiSynergySection plan={plan} />
        </div>
      )}
    </div>
  );
}
