import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Shield, Package, Star, Lightbulb, HelpCircle } from 'lucide-react';
import { useStableEquipment } from './hooks/useStableEquipment';
import { WarriorSelector } from './components/WarriorSelector';
import { LoadoutCard } from './components/LoadoutCard';

/**
 *
 */
export default function StableEquipment() {
  const {
    activeWarriors,
    selectedStyle,
    targetWarriorId,
    targetWarrior,
    carryCap,
    recs,
    tips,
    styleEntries,
    handleStyleChange,
    setTargetWarriorId,
    handleApply,
  } = useStableEquipment();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader title="The Armory" subtitle="ARMORY · LOADOUTS" icon={Shield} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Style & Tips (span-4) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Surface variant="glass" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Style
                </span>
                <span className="text-[8px] uppercase font-bold text-muted-foreground/60 tracking-widest mt-0.5">
                  Recommendations
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                Select Style
              </label>
              <Select
                value={selectedStyle}
                onValueChange={(v) =>
                  handleStyleChange(v as import('@/types/shared.types').FightingStyle)
                }
              >
                <SelectTrigger className="h-10 bg-black/40 border-white/10 font-black text-[10px] uppercase tracking-widest px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10">
                  {styleEntries.map(([val, label]) => (
                    <SelectItem
                      key={val}
                      value={val}
                      className="font-black text-[10px] uppercase tracking-widest"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tips.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-arena-gold tracking-[0.3em]">
                  <Lightbulb className="h-3.5 w-3.5" /> Tips
                </div>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2 italic"
                    >
                      <div className="h-1 w-1 bg-arena-gold shrink-0 mt-1.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-2 p-2.5 bg-white/[0.02]">
                <HelpCircle className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground/40 leading-relaxed italic">
                  Recommendations are based on fighting style and warrior stats.
                </p>
              </div>
            </div>
          </Surface>

          <Surface variant="glass" className="space-y-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 px-1 mb-2">
              <Star className="h-3 w-3 text-arena-gold" /> Style Champions
            </div>
            <WarriorSelector
              warriors={activeWarriors.filter((w) => w.style === selectedStyle)}
              selectedId={targetWarriorId}
              onSelect={setTargetWarriorId}
            />
          </Surface>
        </div>

        {/* Right Column: Recommendations (span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recs.map((rec, i) => (
              <LoadoutCard
                key={i}
                rec={rec}
                index={i}
                carryCap={carryCap}
                targetWarrior={targetWarrior}
                onApply={handleApply}
                disabled={!targetWarriorId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
