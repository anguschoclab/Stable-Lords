import { useState } from 'react';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  STYLE_DISPLAY_NAMES,
  type Warrior,
  type TrainingAssignment,
  type Attributes,
} from '@/types/game';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Check,
  X,
  Heart,
  AlertTriangle,
  Lock,
  Zap,
  Gauge,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { computeGainChance } from '@/engine/training';
import { canGrow } from '@/engine/potential';
import {
  ATTRIBUTE_TRAINING,
  ATTRIBUTE_TOTAL_CAP,
  SEASONAL_GAINS,
  ATTRIBUTE_NEAR_CEILING_BUFFER,
} from '@/constants/training';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';
import {
  traitTrainingPool,
  canAcquireTrait,
  TRAIT_CAP,
} from '@/engine/training/trainingGains/traitTraining'; /**
                                                         * Warrior training card.
                                                         * @param  - {
  warrior,
  assignment,
  seasonal gains,
  trainers,
  on assign,
  on assign recovery,
  on clear,
}.
                                                         */

/**
 * Warrior training card.
 * @param  - {
  warrior,
  assignment,
  seasonal gains,
  trainers,
  on assign,
  on assign recovery,
  on clear,
}.
 */
export function WarriorTrainingCard({
  warrior,
  assignment,
  seasonalGains,
  trainers,
  onAssign,
  onAssignRecovery,
  onClear,
  onAssignTraitTraining,
}: {
  warrior: Warrior;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: import('@/types/game').Trainer[];
  onAssign: (attr: keyof Attributes) => void;
  onAssignRecovery: () => void;
  onClear: () => void;
  onAssignTraitTraining?: (trainerId: string) => void;
}) {
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
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);
  const atCap = total >= ATTRIBUTE_TOTAL_CAP;
  const hasInjury = warrior.injuries.length > 0;
  const isRecovery = assignment?.type === 'recovery';
  const isTraining = assignment?.type === 'attribute';

  return (
    <Surface variant="glass" className="overflow-hidden flex flex-col group h-full">
      {/* Header Section */}
      <div className="p-4 bg-white/5 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <WarriorNameTag id={warrior.id} name={warrior.name} isChampion={warrior.champion} />
            <div className="flex items-center gap-2 opacity-60">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {STYLE_DISPLAY_NAMES[warrior.style]}
              </span>
              <div className="h-2 w-px bg-white/20" />
              <span className="text-[10px] font-mono tracking-wider">Age {warrior.age}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {hasInjury && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-destructive/20 text-destructive px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-destructive/20 animate-pulse cursor-help">
                    <AlertTriangle className="h-2.5 w-2.5" /> INJURED
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="text-[10px] font-mono bg-neutral-900 border-white/10 uppercase tracking-widest"
                >
                  {warrior.injuries.map((i) => (typeof i === 'string' ? i : i.name)).join(' | ')}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-[10px] font-mono opacity-40 cursor-help">Sum {total}/80</div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="bg-neutral-950 border-white/10 text-[10px] font-black uppercase tracking-widest"
              >
                Total attribute points: {total} of 80 cap
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-1 space-y-4">
        {/* Special Action: Recovery */}
        {hasInjury && !isTraining && (
          <Button
            variant="outline"
            onClick={isRecovery ? onClear : onAssignRecovery}
            className={cn(
              'w-full h-10 gap-2 border-white/5 transition-all text-[10px] font-black uppercase tracking-[0.2em]',
              isRecovery
                ? 'bg-destructive/20 text-destructive border-destructive/40 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            <Heart
              className={cn('h-3.5 w-3.5', isRecovery ? 'text-destructive' : 'text-destructive')}
            />
            {isRecovery ? 'CANCEL RECOVERY' : 'ACTIVE RECOVERY'}
          </Button>
        )}

        {/* Attribute List */}
        {!isRecovery && (
          <div className="space-y-1">
            {ATTRIBUTE_KEYS.map((key) => {
              const val = warrior.attributes[key];
              const isSelected = isTraining && assignment?.attribute === key;
              const maxed = val >= ATTRIBUTE_TRAINING.MAX_VALUE;
              const isSZ = key === 'SZ';
              const seasonCapped = (seasonalGains[key] ?? 0) >= SEASONAL_GAINS.CAP;
              const isRevealed = !!warrior.potentialRevealed?.[key];
              const potVal = warrior.potential?.[key] ?? ATTRIBUTE_TRAINING.MAX_VALUE;
              const ceilingHit = !canGrow(val, warrior.potential?.[key]);
              const nearCeiling = isRevealed && val >= potVal - ATTRIBUTE_NEAR_CEILING_BUFFER;
              const disabled = !!assignment || maxed || atCap || isSZ || seasonCapped || ceilingHit;

              // Determine the lock reason for the tooltip
              const lockReason = isSZ
                ? 'Size is fixed'
                : maxed
                  ? `Attribute max (${ATTRIBUTE_TRAINING.MAX_VALUE})`
                  : ceilingHit
                    ? 'At potential ceiling'
                    : atCap
                      ? `Total stat cap (${ATTRIBUTE_TOTAL_CAP}) reached`
                      : seasonCapped
                        ? `Seasonal cap (${SEASONAL_GAINS.CAP}/${SEASONAL_GAINS.CAP} this season)`
                        : null;

              const chance =
                !isSZ && !maxed && !atCap && !seasonCapped && !ceilingHit
                  ? Math.round(computeGainChance(warrior, key, trainers) * 100)
                  : 0;

              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      disabled={disabled}
                      onClick={() => onAssign(key)}
                      className={cn(
                        'group/row relative w-full flex items-center gap-3 px-3 py-2 rounded-none border text-left transition-all',
                        isSelected
                          ? 'bg-primary/20 border-primary shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]'
                          : disabled
                            ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                      )}
                      aria-label={`Assign ${ATTRIBUTE_LABELS[key]} training for ${warrior.name}`}
                    >
                      {/* Label & Value */}
                      <div className="w-16 shrink-0">
                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          {lockReason && !isSelected && (
                            <Lock className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          )}
                          {key}
                        </div>
                        <div className="text-[10px] font-mono opacity-60">
                          {val}
                          <span className="opacity-40">/</span>
                          {isRevealed ? potVal : '??'}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        className="flex-1 relative"
                        data-testid={`training-bar-${key}`}
                        data-chance-class={
                          chance === 0
                            ? 'muted'
                            : chance < 40
                              ? 'arena-gold'
                              : chance < 70
                                ? 'primary'
                                : 'arena-fame'
                        }
                      >
                        <Progress
                          value={(val / ATTRIBUTE_TRAINING.MAX_VALUE) * 100}
                          className={cn(
                            'h-1 bg-white/5',
                            chance === 0
                              ? '[&>div]:bg-muted-foreground/30'
                              : chance < 40
                                ? '[&>div]:bg-arena-gold'
                                : chance < 70
                                  ? '[&>div]:bg-primary'
                                  : '[&>div]:bg-arena-fame'
                          )}
                        />
                        {isRevealed && (
                          <div
                            data-testid={`ceiling-marker-${key}`}
                            className="absolute top-0 bottom-0 w-px bg-arena-gold/60 z-10"
                            style={{ left: `${(potVal / ATTRIBUTE_TRAINING.MAX_VALUE) * 100}%` }}
                            title="Potential Ceiling"
                          />
                        )}
                      </div>

                      {/* Metrics & Status */}
                      <div className="w-12 text-right">
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-primary float-right drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        ) : maxed ? (
                          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                            MAX
                          </div>
                        ) : ceilingHit ? (
                          <Lock className="h-3 w-3 text-arena-gold/60 float-right" />
                        ) : atCap ? (
                          <Lock className="h-3 w-3 text-destructive/60 float-right" />
                        ) : seasonCapped ? (
                          <div className="text-[8px] font-black text-arena-gold uppercase tracking-widest">
                            3/3
                          </div>
                        ) : !disabled ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] font-mono font-bold text-primary/80">
                              {chance}%
                            </span>
                            <ArrowUpRight className="h-2.5 w-2.5 opacity-40 group-hover/row:opacity-100 transition-opacity" />
                          </div>
                        ) : null}
                      </div>

                      {/* Overlay for "Near Ceiling" */}
                      {nearCeiling && (
                        <div className="absolute inset-0 bg-arena-gold/5 pointer-events-none rounded-none border border-arena-gold/10" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="bg-neutral-950 border-white/10 p-3 space-y-2 w-56 z-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {ATTRIBUTE_LABELS[key]}
                      </span>
                      {chance > 0 && (
                        <Badge
                          variant="outline"
                          className="h-4 text-[8px] font-mono bg-primary/10 border-primary/20 text-primary"
                        >
                          {chance}% CHANCE
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {isSZ ? (
                        <p className="text-[9px] leading-relaxed opacity-60 italic">
                          Physiological constants are immutable. Size remains fixed after
                          recruitment.
                        </p>
                      ) : maxed ? (
                        <p className="text-[9px] leading-relaxed text-primary italic">
                          Absolute peak reached (25). No further gains possible.
                        </p>
                      ) : ceilingHit ? (
                        <p className="text-[9px] leading-relaxed text-arena-gold italic">
                          Warrior has reached their potential ceiling for {key}. Scouts may reveal
                          if further growth is possible.
                        </p>
                      ) : atCap ? (
                        <p className="text-[9px] leading-relaxed text-destructive/80 italic">
                          Total stat pool (80) is full. Another attribute must decline before this
                          one can grow.
                        </p>
                      ) : seasonCapped ? (
                        <p className="text-[9px] leading-relaxed text-arena-gold italic">
                          Warrior is exhausted. Rest required before further training to resume
                          growth.
                        </p>
                      ) : (
                        <p className="text-[9px] leading-relaxed opacity-60">
                          {isSelected
                            ? `Assigned to focus on ${ATTRIBUTE_LABELS[key]}. Progress roll executes at week end.`
                            : `Click to prioritize ${key} training this week.`}
                          {isRevealed &&
                            !nearCeiling &&
                            ' Room to grow before reaching natural limits.'}
                          {nearCeiling &&
                            !ceilingHit &&
                            ' Nearing natural limits. Diminishing returns ahead.'}
                        </p>
                      )}
                    </div>
                    {chance > 0 && (
                      <div className="pt-1 border-t border-white/5 flex items-center gap-1 opacity-40">
                        <Zap className="h-2.5 w-2.5" />
                        <span className="text-[8px] uppercase tracking-widest">
                          Trainer bonuses active
                        </span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Trait Training Section */}
      {onAssignTraitTraining && !isRecovery && traitSlotsLeft > 0 && (
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
      )}

      {/* Footer Section */}
      {assignment && (
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-primary opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {isRecovery ? 'REST MODE' : `CORE DRILL: ${assignment.attribute}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 group-hover:bg-destructive/10 group-hover:text-destructive text-[10px] font-black tracking-widest uppercase"
          >
            <X className="h-3 w-3 mr-1.5" /> TERMINATE
          </Button>
        </div>
      )}
    </Surface>
  );
}
