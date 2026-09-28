import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconMedallion } from '@/components/ui/IconMedallion';
import { getCrestDescription, getChargeDescription } from '@/engine/crest/crestGenerator';
import { StableCrest } from '@/components/crest/StableCrest';
import { hexToRgba } from '@/lib/utils';
import type { CrestData } from '@/types/crest.types';

/** Title + flavour text at the top of the new-game form. */
export function FormHeader() {
  return (
    <div className="text-center space-y-4">
      <IconMedallion icon={<Dices className="h-6 w-6 text-foreground" strokeWidth={1.5} />} />
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">FORGE YOUR STABLE</h2>
        <p className="text-muted-foreground text-xs mt-2 leading-relaxed max-w-xs mx-auto">
          The orphanage doors creak open. Beyond them lies the roar of the crowd, the clash of
          steel, and a chance to forge legends.
        </p>
      </div>
    </div>
  );
}

/** Thin gold ornament divider. */
export function GoldDivider({ faint = false }: { faint?: boolean }) {
  return (
    <div
      className="h-px"
      style={{
        background: faint
          ? 'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.2) 40%, rgba(var(--gold-glow-rgb), 0.2) 60%, transparent)'
          : 'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.5) 30%, rgba(var(--gold-glow-rgb), 0.8) 50%, rgba(var(--gold-glow-rgb), 0.5) 70%, transparent)',
      }}
    />
  );
}

/** Labeled text input with an adjacent dice button that fills a random value. */
export function NameField({
  id,
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  autoFocus,
  onRandomize,
  randomizeLabel,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  autoFocus?: boolean;
  onRandomize: () => void;
  randomizeLabel: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70"
      >
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className="flex-1 h-10 text-sm bg-background border-[rgba(var(--oak-rgb),_0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
        />
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onRandomize}
          tooltip="Random name"
          aria-label={randomizeLabel}
          className="h-10 w-10 shrink-0 border-[rgba(var(--oak-rgb),_0.8)] bg-background hover:border-accent/40 hover:bg-accent/5"
        >
          <Dices className="h-4 w-4 text-accent/70" />
        </Button>
      </div>
    </div>
  );
}

/** Heraldic crest preview tinted by its primary color, with a randomize control. */
export function CrestPanel({
  crest,
  onRandomize,
}: {
  crest: CrestData;
  onRandomize: () => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70 flex items-center gap-2">
        HERALDIC SEAL
        <span className="text-[8px] text-muted-foreground/50 normal-case tracking-normal">
          — Your sigil in the arena
        </span>
      </label>

      <div
        className="relative p-6 flex flex-col items-center gap-4"
        style={{
          background: `linear-gradient(145deg, rgba(var(--gold-glow-rgb), 0.05) 0%, ${hexToRgba(crest.primaryColor, 0.03)} 50%, rgba(var(--inkwash-rgb), 0.8) 100%)`,
          border: '1px solid rgba(var(--gold-glow-rgb), 0.25)',
          borderTopColor: 'rgba(var(--gold-glow-rgb), 0.4)',
        }}
      >
        <div
          className="absolute top-0 left-4 right-4 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.3) 30%, rgba(var(--gold-glow-rgb), 0.5) 50%, rgba(var(--gold-glow-rgb), 0.3) 70%, transparent)',
          }}
        />

        <div className="relative">
          <StableCrest
            crest={crest}
            size={80}
            showMantling
            className="drop-shadow-[0_0_15px_rgba(var(--gold-glow-rgb), 0.2)]"
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] text-muted-foreground italic">
            {getCrestDescription(crest)}
          </p>
          <p className="text-[9px] text-accent/60 uppercase tracking-widest">
            {getChargeDescription(crest.charge)}
          </p>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={onRandomize}
          title="Randomize heraldry"
          aria-label="Randomize your heraldic crest"
          className="h-9 px-4 gap-2 border-[rgba(var(--oak-rgb),_0.8)] bg-background hover:border-accent/40 hover:bg-accent/5 text-[11px] font-black uppercase tracking-wider"
        >
          <Dices className="h-4 w-4 text-accent/70" />
          RANDOMIZE HERALDRY
        </Button>
      </div>
    </div>
  );
}
