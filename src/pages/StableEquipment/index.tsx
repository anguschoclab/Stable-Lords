import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Check, RotateCcw, Shield } from 'lucide-react';
import { useStableEquipment } from './hooks/useStableEquipment';
import { ArmorySidebar } from './components/ArmorySidebar';
import { LoadoutCard } from './components/LoadoutCard';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { DEFAULT_LOADOUT, getItemById, type EquipmentLoadout } from '@/data/equipment';

function itemName(id: string) {
  return getItemById(id)?.name ?? 'None';
}

function PendingLoadoutReview({
  pending,
  current,
  onCommit,
  onCancel,
}: {
  pending: { loadout: EquipmentLoadout; label: string } | null;
  current: EquipmentLoadout;
  onCommit: () => void;
  onCancel: () => void;
}) {
  if (!pending) return null;
  const slots = ['weapon', 'armor', 'shield', 'helm'] as const;
  return (
    <Surface
      variant="glass"
      aria-live="polite"
      className="p-5 border-primary/30 space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
            Pending loadout review
          </p>
          <p className="text-sm font-display font-black uppercase text-foreground mt-1">
            {pending.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <RotateCcw className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button onClick={onCommit}>
            <Check className="h-3.5 w-3.5" /> Confirm Loadout
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <div key={slot} className="border border-white/5 bg-black/20 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
              {slot}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {itemName(current[slot])} <span className="text-primary">→</span>{' '}
              <span className="text-foreground font-bold">{itemName(pending.loadout[slot])}</span>
            </p>
          </div>
        ))}
      </div>
    </Surface>
  );
}

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
    pendingLoadout,
    commitLoadout,
    cancelLoadout,
  } = useStableEquipment();

  return (
    <PageFrame maxWidth="lg" className="space-y-8 pb-20">
      <PageHeader title="The Armory" subtitle="ARMORY · LOADOUTS" icon={Shield} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <ArmorySidebar
          selectedStyle={selectedStyle}
          styleEntries={styleEntries}
          tips={tips}
          onStyleChange={handleStyleChange}
          championWarriors={activeWarriors.filter((w) => w.style === selectedStyle)}
          targetWarriorId={targetWarriorId}
          onSelectWarrior={setTargetWarriorId}
        />

        {/* Right Column: Recommendations (span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <PendingLoadoutReview
            pending={pendingLoadout}
            current={targetWarrior?.equipment ?? DEFAULT_LOADOUT}
            onCommit={commitLoadout}
            onCancel={cancelLoadout}
          />
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
    </PageFrame>
  );
}
