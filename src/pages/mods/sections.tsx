import type { RefObject } from 'react';
import { Skull, ScrollText, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import type { HouseRules } from '@/types/state.types';
import type { ContentPack } from '@/lib/contentPacks';

const DEATH_RATE_OPTIONS = [
  { value: 1, label: 'Canonical (full rate)' },
  { value: 0.5, label: 'Reduced (half rate)' },
  { value: 0.25, label: 'Merciful (quarter rate)' },
  { value: 0, label: 'No-Death Exhibitions' },
];

const MODS_BTN =
  'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-none transition-colors motion-reduce:transition-none';

type HouseRulesSectionProps = {
  houseRules: HouseRules;
  nonCanonical: boolean;
  setRules: (patch: Partial<HouseRules>) => void;
  resetRules: () => void;
};

function HouseRulesStatus({ nonCanonical, resetRules }: Pick<HouseRulesSectionProps, 'nonCanonical' | 'resetRules'>) {
  return (
    <>
      {nonCanonical && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400/90 border border-amber-400/30 bg-amber-400/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          House rules active — this game is not canonical permadeath
        </div>
      )}
      <div className="flex flex-col gap-3 border border-white/5 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">
          House rules apply immediately — no restart required
        </p>
        <button
          type="button"
          onClick={resetRules}
          className={cn(MODS_BTN, 'border-white/10 text-muted-foreground hover:bg-white/5')}
        >
          Restore canonical rules
        </button>
      </div>
    </>
  );
}

function DeathRateControl({ houseRules, setRules }: Pick<HouseRulesSectionProps, 'houseRules' | 'setRules'>) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Skull className="h-3.5 w-3.5 text-arena-blood" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
          Death Rate
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Multiplier applied to every kill-window check in every bout.
      </p>
      <div className="flex flex-wrap gap-2">
        {DEATH_RATE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setRules({ deathRateMult: o.value })}
            className={cn(
              MODS_BTN,
              houseRules.deathRateMult === o.value
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-white/10 text-muted-foreground hover:bg-white/5'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SevereInjuryControl({ houseRules, setRules }: Pick<HouseRulesSectionProps, 'houseRules' | 'setRules'>) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Skull className="h-3.5 w-3.5 text-arena-blood" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
          Severe Injury Instead of Death
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Fatal blows become Critical injuries. No warrior dies; no graveyard entries are created.
      </p>
      <button
        type="button"
        onClick={() =>
          setRules({ severeInjuryInsteadOfDeath: !houseRules.severeInjuryInsteadOfDeath })
        }
        className={cn(
          MODS_BTN,
          houseRules.severeInjuryInsteadOfDeath
            ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
            : 'border-white/10 text-muted-foreground hover:bg-white/5'
        )}
      >
        {houseRules.severeInjuryInsteadOfDeath ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}

/** House rules panel — death-rate multiplier and severe-injury-instead-of-death toggle. */
export function HouseRulesSection(props: HouseRulesSectionProps) {
  const { houseRules, nonCanonical, setRules, resetRules } = props;
  return (
    <Surface variant="glass" className="p-6 mt-4 space-y-5">
      <HouseRulesStatus nonCanonical={nonCanonical} resetRules={resetRules} />
      <DeathRateControl houseRules={houseRules} setRules={setRules} />
      <SevereInjuryControl houseRules={houseRules} setRules={setRules} />
    </Surface>
  );
}

type ContentPacksSectionProps = {
  contentPacks: ContentPack[];
  fileRef: RefObject<HTMLInputElement | null>;
  pendingPack: string | null;
  packError: string | null;
  installPack: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePack: (id: string) => void;
};

function PackInstallControls({ fileRef, installPack }: Pick<ContentPacksSectionProps, 'fileRef' | 'installPack'>) {
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={installPack}
        aria-label="Choose content pack file"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={cn(
          MODS_BTN,
          'border-white/10 text-foreground/80 hover:bg-white/5 flex items-center gap-2'
        )}
      >
        <Upload className="h-3.5 w-3.5" />
        Install Pack (JSON)
      </button>
    </>
  );
}

function PackStatus({ pendingPack, packError }: Pick<ContentPacksSectionProps, 'pendingPack' | 'packError'>) {
  return (
    <div aria-live="polite" className="mt-3 space-y-2">
      {pendingPack && (
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-arena-gold/80">
          Installing {pendingPack}…
        </p>
      )}
      {packError && (
        <p role="alert" className="text-[10px] font-black uppercase tracking-[0.15em] text-destructive">
          {packError}
        </p>
      )}
      {!pendingPack && !packError && (
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
          Installed packs apply immediately — no restart required
        </p>
      )}
    </div>
  );
}

function PackList({ contentPacks, removePack }: Pick<ContentPacksSectionProps, 'contentPacks' | 'removePack'>) {
  if (contentPacks.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {contentPacks.map((p) => (
        <li key={p.id} className="flex items-center justify-between border border-white/5 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <ScrollText className="h-3.5 w-3.5 text-arena-gold shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground/90 truncate">{p.name}</div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                Applied · {p.arenaLore?.length ?? 0} lore ·{' '}
                {Object.keys(p.recruitQuotes ?? {}).length} quotes
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removePack(p.id)}
            className="p-1 text-muted-foreground/60 hover:text-arena-blood transition-colors motion-reduce:transition-none"
            aria-label={`Remove pack ${p.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Content packs panel — installs and removes JSON narrative overlays (arena lore, recruit quotes). */
export function ContentPacksSection(props: ContentPacksSectionProps) {
  const { contentPacks, fileRef, pendingPack, packError, installPack, removePack } = props;
  return (
    <Surface variant="glass" className="p-6 mt-4">
      <p className="text-xs text-muted-foreground mb-4">
        Content packs overlay narrative data — arena lore and doctrine quotes — onto the canonical
        archives. Packs are saved with your game and validated on install.
      </p>
      <PackInstallControls fileRef={fileRef} installPack={installPack} />
      <PackStatus pendingPack={pendingPack} packError={packError} />
      <PackList contentPacks={contentPacks} removePack={removePack} />
    </Surface>
  );
}
