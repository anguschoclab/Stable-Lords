import { Crosshair, Shield, Target, Settings2 } from 'lucide-react';
import PlanBuilder from '@/components/PlanBuilder';
import EquipmentLoadoutUI from '@/components/EquipmentLoadout';
import { SchedulingWidget } from '@/components/widgets';
import { Warrior, FightPlan } from '@/types/game';
import { EquipmentLoadout } from '@/data/equipment';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

interface MissionControlTabProps {
  warrior: Warrior;
  currentPlan: FightPlan;
  currentLoadout: EquipmentLoadout;
  onPlanChange: (plan: FightPlan) => void;
  onEquipmentChange: (loadout: EquipmentLoadout) => void;
} /**
   * Mission control tab.
   * @param  - {
  warrior,
  display warrior,
  current plan,
  current loadout,
  on plan change,
  on equipment change,
}.
   */

/**
 * Mission control tab.
 * @param  - {
  warrior,
  display warrior,
  current plan,
  current loadout,
  on plan change,
  on equipment change,
}.
 */
export function MissionControlTab({
  warrior,
  currentPlan,
  currentLoadout,
  onPlanChange,
  onEquipmentChange,
}: MissionControlTabProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <SectionDivider label="Pre-Fight Orders" />
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="bg-white/[0.01] px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ImperialRing size="sm" variant="gold">
                <Crosshair className="h-4 w-4 text-arena-gold" />
              </ImperialRing>
              <span className="font-display font-black uppercase tracking-[0.2em] text-[11px]">
                Battle Doctrine
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 border border-primary/20 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">
              <Settings2 className="h-3 w-3" /> Custom Mandate
            </div>
          </div>
          <div className="p-10">
            <PlanBuilder warrior={warrior} plan={currentPlan} onPlanChange={onPlanChange} />
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <SectionDivider label="Arming" />
          <Surface variant="glass" className="border-white/5 overflow-hidden">
            <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
              <ImperialRing size="xs" variant="silver">
                <Shield className="h-3 w-3 text-muted-foreground" />
              </ImperialRing>
              <span className="font-display font-black uppercase tracking-widest text-[10px]">
                Issued Arms
              </span>
            </div>
            <div className="p-8">
              <EquipmentLoadoutUI
                loadout={currentLoadout}
                style={warrior.style}
                carryCap={warrior.derivedStats?.encumbrance ?? 0}
                warriorAttrs={warrior.attributes}
                onChange={onEquipmentChange}
              />
            </div>
          </Surface>
        </div>

        <div className="space-y-8">
          <SectionDivider label="Intelligence" />
          <Surface variant="glass" className="border-white/5 overflow-hidden">
            <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex items-center gap-4">
              <ImperialRing size="xs" variant="bronze">
                <Target className="h-3 w-3 text-muted-foreground" />
              </ImperialRing>
              <span className="font-display font-black uppercase tracking-widest text-[10px]">
                Dispatches
              </span>
            </div>
            <div className="p-2 h-full overflow-y-auto max-h-[600px] thin-scrollbar">
              <SchedulingWidget warrior={warrior} />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
