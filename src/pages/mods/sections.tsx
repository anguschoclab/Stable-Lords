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

export const MODS_BTN =
  'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-none transition-colors motion-reduce:transition-none';

/** House rules panel — death-rate multiplier and severe-injury-instead-of-death toggle. */
export function HouseRulesSection({
  houseRules,
  nonCanonical,
  setRules,
}: {
  houseRules: HouseRules;
  nonCanonical: boolean;
  setRules: (patch: Partial<HouseRules>) => void;
}) {
  return (
    <Surface variant="glass" className="p-6 mt-4 space-y-5">
      {nonCanonical && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400/90 border border-amber-400/30 bg-amber-400/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          House rules active — this game is not canonical permadeath
        </div>
      )}
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

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Skull className="h-3.5 w-3.5 text-arena-blood" />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
            Severe Injury Instead of Death
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Fatal blows become Critical injuries. No warrior dies; no graveyard
          entries are created.
        </p>
        <button
          type="button"
          onClick={() =>
            setRules({
              severeInjuryInsteadOfDeath: !houseRules.severeInjuryInsteadOfDeath,
            })
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
    </Surface>
  );
}

/** Content packs panel — installs and removes JSON narrative overlays (arena lore, recruit quotes). */
export function ContentPacksSection({
  contentPacks,
  fileRef,
  installPack,
  removePack,
}: {
  contentPacks: ContentPack[];
  fileRef: RefObject<HTMLInputElement | null>;
  installPack: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePack: (id: string) => void;
}) {
  return (
    <Surface variant="glass" className="p-6 mt-4">
      <p className="text-xs text-muted-foreground mb-4">
        Content packs overlay narrative data — arena lore and doctrine
        quotes — onto the canonical archives. Packs are saved with your
        game and validated on install.
      </p>
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
        className={cn(MODS_BTN, 'border-white/10 text-foreground/80 hover:bg-white/5 flex items-center gap-2')}
      >
        <Upload className="h-3.5 w-3.5" />
        Install Pack (JSON)
      </button>

      {contentPacks.length > 0 && (
        <ul className="mt-4 space-y-2">
          {contentPacks.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between border border-white/5 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ScrollText className="h-3.5 w-3.5 text-arena-gold shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground/90 truncate">
                    {p.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                    {p.arenaLore?.length ?? 0} lore · {Object.keys(p.recruitQuotes ?? {}).length} quotes
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
      )}
    </Surface>
  );
}
