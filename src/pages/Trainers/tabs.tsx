import { Armchair, GraduationCap, RefreshCw, UserPlus, Zap } from 'lucide-react';
import {
  TRAINER_FOCUSES,
  FOCUS_ICONS,
  TIER_BONUS,
  TIER_COST,
  type TrainerTier,
  type TrainerFocus,
} from '@/engine/trainers/trainers';
import type { Trainer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { TrainerCard } from '@/components/stable/TrainerCard';
import { canTransact } from '@/engine/economy/utils';

/** Empty-state surface shown when the stable has no trainers. */
function EmptyStaffState() {
  return (
          <Surface
            variant="glass"
            className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
          >
            <ImperialRing size="lg" variant="bronze" className="opacity-20">
              <GraduationCap className="h-8 w-8" />
            </ImperialRing>
            <div className="space-y-2">
              <h4 className="font-display font-black uppercase tracking-widest text-muted-foreground/60">
                No Trainers
              </h4>
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] italic max-w-sm mx-auto">
                Hire specialists from the hiring pool to begin training your warriors.
              </p>
            </div>
          </Surface>
  );
}

/** Aggregate bonus tile for one training focus. */
function FocusBonus({ focus, total }: { focus: TrainerFocus; total: number }) {
  return (
    <div className="group relative flex flex-col items-center gap-6">
      <div className="text-5xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 motion-reduce:transition-none motion-reduce:transform-none">
        {FOCUS_ICONS[focus]}
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl font-display font-black text-foreground">
            +{total}
          </span>
          <Zap className="h-4 w-4 text-arena-gold animate-pulse motion-reduce:animate-none" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary transition-colors motion-reduce:transition-none">
          {focus}
        </span>
      </div>
    </div>
  );
}

/** Current-staff tab: trainer cards, focus-bonus summary, retire-to-coach CTA. */
export function CurrentStaffTab({
  currentTrainers,
  convertableRetired,
  canHire,
  onFire,
  onOpenConvert,
}: {
  currentTrainers: Trainer[];
  convertableRetired: Warrior[];
  canHire: boolean;
  onFire: (id: Trainer['id']) => void;
  onOpenConvert: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-8">
        {currentTrainers.length === 0 ? (
          <EmptyStaffState />
        ) : (
          <div className="space-y-6">
            <SectionDivider label="Current Staff" variant="primary" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {currentTrainers.map((t) => (
                <TrainerCard key={t.id} trainer={t} owned onFire={() => onFire(t.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {currentTrainers.length > 0 && (
        <div className="space-y-8">
          <SectionDivider label="Staff Bonuses" variant="gold" />
          <Surface
            variant="glass"
            padding="none"
            className="border-white/5 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-arena-gold/40" />
            <div className="p-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12">
              {TRAINER_FOCUSES.map((focus) => {
                const total = currentTrainers
                  .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                  .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);

                return (
                  total > 0 && <FocusBonus key={focus} focus={focus} total={total} />
                );
              })}
            </div>
          </Surface>
        </div>
      )}

      {convertableRetired.length > 0 && canHire && (
        <RetireToCoachCta
          convertableRetired={convertableRetired}
          onOpenConvert={onOpenConvert}
        />
      )}
    </>
  );
}

/** Full-width CTA opening the retire-to-coach reassignment dialog. */
function RetireToCoachCta({
  convertableRetired,
  onOpenConvert,
}: {
  convertableRetired: Warrior[];
  onOpenConvert: () => void;
}) {
  return (
    <div className="mt-12">
      <Button
        onClick={onOpenConvert}
        className="w-full h-20 bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-all rounded-none flex items-center justify-center gap-6 group motion-reduce:transition-none"
      >
        <ImperialRing
          size="md"
          variant="blood"
          className="group-hover:scale-110 transition-transform motion-reduce:transition-none motion-reduce:transform-none"
        >
          <Armchair className="h-5 w-5" />
        </ImperialRing>
        <div className="text-left">
          <span className="text-[12px] font-black uppercase tracking-[0.3em] block mb-1">
            Retire to Coach
          </span>
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest italic">
            {convertableRetired.length} retired warriors available to coach
          </span>
        </div>
      </Button>
    </div>
  );
}

/** Cost label + hire button rendered inside a candidate TrainerCard. */
function HireAction({
  trainer,
  treasury,
  canHire,
  onHire,
}: {
  trainer: Trainer;
  treasury: number;
  canHire: boolean;
  onHire: (t: Trainer) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Cost
        </span>
        <span className="font-display font-black text-arena-gold text-lg leading-none">
          {TIER_COST[trainer.tier as TrainerTier] ?? 50}G
        </span>
      </div>

      <Button
        disabled={
          !canHire || !canTransact(treasury, TIER_COST[trainer.tier as TrainerTier] ?? 50)
        }
        onClick={() => onHire(trainer)}
        className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(135,34,40,0.3)] transition-all motion-reduce:transition-none"
      >
        <UserPlus className="h-4 w-4 mr-3" />
        Hire
      </Button>
    </div>
  );
}

/** Hire tab: refreshable candidate pool with per-trainer hire actions. */
export function HireTab({
  currentHiringPool,
  treasury,
  canHire,
  refreshPool,
  hireTrainer,
}: {
  currentHiringPool: Trainer[];
  treasury: number;
  canHire: boolean;
  refreshPool: () => void;
  hireTrainer: (t: Trainer) => void;
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] border border-white/5 p-8 rounded-none gap-8">
        <div className="flex items-center gap-5">
          <ImperialRing size="md" variant="blood">
            <RefreshCw className="h-5 w-5 text-primary" />
          </ImperialRing>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none mb-1.5">
              Available Trainers
            </h3>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">
              {currentHiringPool.length} candidates available
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={refreshPool}
          className="h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-3 rounded-none border-white/10 hover:bg-white/5 transition-all motion-reduce:transition-none"
        >
          <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-all duration-700 motion-reduce:transition-none motion-reduce:transform-none" />
          Refresh Pool
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {currentHiringPool.map((t) => (
          <TrainerCard
            key={t.id}
            trainer={t}
            owned={false}
            action={
              <HireAction
                trainer={t}
                treasury={treasury}
                canHire={canHire}
                onHire={hireTrainer}
              />
            }
          />
        ))}
      </div>
    </>
  );
}
