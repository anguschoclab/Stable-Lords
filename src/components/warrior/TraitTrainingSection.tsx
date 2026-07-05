import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';
import { type Warrior, type TrainingAssignment } from '@/types/game';
import type { Trainer } from '@/types/shared.types';
import {
  traitTrainingPool,
  canAcquireTrait,
  TRAIT_CAP,
} from '@/engine/training/trainingGains/traitTraining';

interface TraitTrainingSectionProps {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  isRecovery: boolean;
  trainers: Trainer[];
  onAssignTraitTraining?: (trainerId: string) => void;
  onClear?: () => void;
}

export function TraitTrainingSection({
  warrior,
  assignment,
  isRecovery,
  trainers,
  onAssignTraitTraining,
  onClear,
}: TraitTrainingSectionProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const isTraitTraining = assignment?.type === 'trait';
  const traitCount = warrior.traits?.length ?? 0;
  const traitSlotsLeft = TRAIT_CAP - traitCount;
  const selectedTrainer = selectedTrainerId
    ? (trainers.find((t) => t.id === selectedTrainerId) ?? null)
    : null;
  const pool = selectedTrainer
    ? traitTrainingPool(warrior, selectedTrainer).filter((t) => canAcquireTrait(warrior, t.id))
    : [];

  if (!onAssignTraitTraining || isRecovery || traitSlotsLeft <= 0) return null;

  return (
    <div className="p-4 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-arena-fame" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Trait Training · {traitCount}/{TRAIT_CAP}
        </span>
      </div>
      {isTraitTraining ? (
        <div className="flex items-center justify-between bg-arena-fame/10 border border-arena-fame/20 px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-fame">
            In Progress · {assignment?.weeksRemaining ?? 0}w left
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-[9px] font-black tracking-widest uppercase hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" /> CANCEL
          </Button>
        </div>
      ) : (
        <>
          <select
            value={selectedTrainerId ?? ''}
            onChange={(e) => setSelectedTrainerId(e.target.value || null)}
            className="w-full bg-black/40 border border-white/10 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <option value="">Select trainer for trait training…</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.tier}
              </option>
            ))}
          </select>
          {pool.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pool.map((t) => (
                <TraitBadge key={t.id} traitId={t.id} />
              ))}
            </div>
          )}
          {selectedTrainer && pool.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssignTraitTraining(selectedTrainer.id)}
              className="w-full h-8 text-[9px] font-black uppercase tracking-widest border-arena-fame/30 bg-arena-fame/10 hover:bg-arena-fame/20 text-arena-fame rounded-none"
            >
              Begin Trait Training with {selectedTrainer.name}
            </Button>
          )}
          {selectedTrainer && pool.length === 0 && (
            <p className="text-[9px] text-muted-foreground/60 italic">
              No reachable traits for this warrior with {selectedTrainer.name}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
