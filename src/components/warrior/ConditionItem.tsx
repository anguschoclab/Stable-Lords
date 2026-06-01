import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PlanCondition,
  ConditionTriggerType,
  OffensiveTactic,
  DefensiveTactic,
} from '@/types/game';

export const TRIGGER_OPTIONS: {
  label: string;
  type: ConditionTriggerType;
  inputType: 'percent' | 'integer' | 'phase';
}[] = [
  { label: 'HP Below', type: 'HP_BELOW', inputType: 'percent' },
  { label: 'HP Above', type: 'HP_ABOVE', inputType: 'percent' },
  { label: 'Endurance Below', type: 'ENDURANCE_BELOW', inputType: 'percent' },
  { label: 'Momentum Lead', type: 'MOMENTUM_LEAD', inputType: 'integer' },
  { label: 'Momentum Deficit', type: 'MOMENTUM_DEFICIT', inputType: 'integer' },
  { label: 'Phase Is', type: 'PHASE_IS', inputType: 'phase' },
];

export const OFFENSIVE_TACTICS: { label: string; value: OffensiveTactic }[] = [
  { label: '—', value: 'none' },
  { label: 'Lunge', value: 'Lunge' },
  { label: 'Slash', value: 'Slash' },
  { label: 'Bash', value: 'Bash' },
  { label: 'Decisiveness', value: 'Decisiveness' },
];

export const DEFENSIVE_TACTICS: { label: string; value: DefensiveTactic }[] = [
  { label: '—', value: 'none' },
  { label: 'Dodge', value: 'Dodge' },
  { label: 'Parry', value: 'Parry' },
  { label: 'Riposte', value: 'Riposte' },
  { label: 'Responsiveness', value: 'Responsiveness' },
];

export function triggerDisplayValue(cond: PlanCondition): string {
  const opt = TRIGGER_OPTIONS.find((o) => o.type === cond.trigger.type);
  if (!opt) return String(cond.trigger.value);
  if (opt.inputType === 'percent') return `${cond.trigger.value}%`;
  if (opt.inputType === 'phase') return String(cond.trigger.value);
  return String(cond.trigger.value);
}

interface ConditionItemProps {
  cond: PlanCondition;
  idx: number;
  removeCondition: (idx: number) => void;
  updateTrigger: (idx: number, type: ConditionTriggerType) => void;
  updateTriggerValue: (idx: number, raw: string) => void;
  updateOverrideSlider: (
    idx: number,
    key: 'OE' | 'AL' | 'killDesire',
    val: number | undefined
  ) => void;
  updateOverrideTactic: (
    idx: number,
    key: 'offensiveTactic' | 'defensiveTactic',
    val: string
  ) => void;
  updateCondition: (idx: number, partial: Partial<PlanCondition>) => void;
}

export function ConditionItem({
  cond,
  idx,
  removeCondition,
  updateTrigger,
  updateTriggerValue,
  updateOverrideSlider,
  updateOverrideTactic,
  updateCondition,
}: ConditionItemProps) {
  const trigOpt = TRIGGER_OPTIONS.find((o) => o.type === cond.trigger.type);
  if (!trigOpt) return null;

  return (
    <div className="border border-white/10 bg-black/30 p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Badge className="rounded-none border-white/20 bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
          Condition {idx + 1}
        </Badge>
        <div className="flex items-center gap-2">
          {cond.label && (
            <span className="text-[9px] font-black uppercase tracking-widest text-arena-gold italic">
              {cond.label}
            </span>
          )}
          <button
            onClick={() => removeCondition(idx)}
            className="text-muted-foreground/40 hover:text-destructive transition-colors"
            aria-label="Remove condition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WHEN row */}
      <div className="space-y-2">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          When
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={cond.trigger.type}
            onChange={(e) => updateTrigger(idx, e.target.value as ConditionTriggerType)}
            className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
          >
            {TRIGGER_OPTIONS.map((o) => (
              <option key={o.type} value={o.type}>
                {o.label}
              </option>
            ))}
          </select>

          {trigOpt.inputType === 'phase' ? (
            <select
              value={String(cond.trigger.value)}
              onChange={(e) => updateTriggerValue(idx, e.target.value)}
              className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
            >
              <option value="Opening">Opening</option>
              <option value="Mid">Mid</option>
              <option value="Late">Late</option>
            </select>
          ) : trigOpt.inputType === 'integer' ? (
            <select
              value={String(cond.trigger.value)}
              onChange={(e) => updateTriggerValue(idx, e.target.value)}
              className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <label htmlFor={`condition-item-${idx}-value`} className="sr-only">
                Trigger Value
              </label>
              <input
                id={`condition-item-${idx}-value`}
                type="number"
                min={0}
                max={100}
                step={5}
                value={Number(cond.trigger.value)}
                onChange={(e) => updateTriggerValue(idx, e.target.value)}
                className="w-16 bg-black/60 border border-white/10 text-[10px] font-mono font-bold text-arena-gold px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 text-center"
              />
              <span className="text-[10px] text-muted-foreground/60 font-bold">%</span>
            </div>
          )}

          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            → {triggerDisplayValue(cond)}
          </span>
        </div>
      </div>

      {/* THEN row */}
      <div className="space-y-3">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          Then Override
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OE override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  cond.override.OE !== undefined
                    ? 'text-arena-gold'
                    : 'text-muted-foreground/40'
                )}
              >
                OE {cond.override.OE !== undefined ? cond.override.OE : '—'}
              </Label>
              {cond.override.OE !== undefined ? (
                <button
                  onClick={() => updateOverrideSlider(idx, 'OE', undefined)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
                  aria-label="Clear OE override"
                >
                  clear
                </button>
              ) : (
                <button
                  onClick={() => updateOverrideSlider(idx, 'OE', 5)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-gold"
                  aria-label="Set OE override"
                >
                  set
                </button>
              )}
            </div>
            {cond.override.OE !== undefined && (
              <Slider
                value={[cond.override.OE]}
                onValueChange={([v]) => updateOverrideSlider(idx, 'OE', v)}
                min={1}
                max={10}
                step={1}
              />
            )}
          </div>

          {/* AL override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  cond.override.AL !== undefined
                    ? 'text-arena-fame'
                    : 'text-muted-foreground/40'
                )}
              >
                AL {cond.override.AL !== undefined ? cond.override.AL : '—'}
              </Label>
              {cond.override.AL !== undefined ? (
                <button
                  onClick={() => updateOverrideSlider(idx, 'AL', undefined)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
                  aria-label="Clear AL override"
                >
                  clear
                </button>
              ) : (
                <button
                  onClick={() => updateOverrideSlider(idx, 'AL', 5)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-fame"
                  aria-label="Set AL override"
                >
                  set
                </button>
              )}
            </div>
            {cond.override.AL !== undefined && (
              <Slider
                value={[cond.override.AL]}
                onValueChange={([v]) => updateOverrideSlider(idx, 'AL', v)}
                min={1}
                max={10}
                step={1}
              />
            )}
          </div>

          {/* KD override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  cond.override.killDesire !== undefined
                    ? 'text-destructive'
                    : 'text-muted-foreground/40'
                )}
              >
                KD {cond.override.killDesire !== undefined ? cond.override.killDesire : '—'}
              </Label>
              {cond.override.killDesire !== undefined ? (
                <button
                  onClick={() => updateOverrideSlider(idx, 'killDesire', undefined)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
                  aria-label="Clear Kill Desire override"
                >
                  clear
                </button>
              ) : (
                <button
                  onClick={() => updateOverrideSlider(idx, 'killDesire', 5)}
                  className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
                  aria-label="Set Kill Desire override"
                >
                  set
                </button>
              )}
            </div>
            {cond.override.killDesire !== undefined && (
              <Slider
                value={[cond.override.killDesire]}
                onValueChange={([v]) => updateOverrideSlider(idx, 'killDesire', v)}
                min={1}
                max={10}
                step={1}
              />
            )}
          </div>
        </div>

        {/* Tactic overrides */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Off. Tactic
            </div>
            <select
              value={cond.override.offensiveTactic ?? 'none'}
              onChange={(e) => updateOverrideTactic(idx, 'offensiveTactic', e.target.value)}
              className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-blood/40 appearance-none"
            >
              {OFFENSIVE_TACTICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Def. Tactic
            </div>
            <select
              value={cond.override.defensiveTactic ?? 'none'}
              onChange={(e) => updateOverrideTactic(idx, 'defensiveTactic', e.target.value)}
              className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
            >
              {DEFENSIVE_TACTICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <label
            htmlFor={`condition-item-${idx}-label`}
            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block"
          >
            Label (optional)
          </label>
          <input
            id={`condition-item-${idx}-label`}
            type="text"
            placeholder="e.g. Survival Mode"
            maxLength={32}
            value={cond.label ?? ''}
            onChange={(e) => updateCondition(idx, { label: e.target.value || undefined })}
            className="w-full bg-black/60 border border-white/10 text-[10px] font-bold text-foreground placeholder:text-muted-foreground/20 px-2 py-1.5 focus:outline-none focus:border-arena-gold/40"
          />
        </div>
      </div>
    </div>
  );
}
