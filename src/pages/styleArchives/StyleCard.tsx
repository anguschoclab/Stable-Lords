import { useMemo } from 'react';
import { Swords, Shield } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV, ATTRIBUTE_KEYS } from '@/types/shared.types';
import { STYLE_COMPENDIUM } from '@/data/styleCompendium';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import { STYLE_FAMILY, FAMILY_GUIDE } from '@/data/designDoctrine';
import { STYLE_ARCHETYPE_FIT, WINNING_ARCHETYPES } from '@/data/warriorArchetypes';
import { getMatchupBonus, STYLE_ORDER } from '@/constants/combat/combat/matchup';
import { getWeaponSuitability } from '@/engine/equipment/weaponSuitability';
import { WEAPONS } from '@/data/equipment';

/** Styles a given style holds a matchup advantage over, best first. */
function strongestAgainst(style: FightingStyle): FightingStyle[] {
  return STYLE_ORDER.filter((s) => s !== style && getMatchupBonus(style, s) > 0).sort(
    (a, b) => getMatchupBonus(style, b) - getMatchupBonus(style, a)
  );
}

/** Styles that hold a matchup advantage over the given style, worst first. */
function weakestAgainst(style: FightingStyle): FightingStyle[] {
  return STYLE_ORDER.filter((s) => s !== style && getMatchupBonus(style, s) < 0).sort(
    (a, b) => getMatchupBonus(style, a) - getMatchupBonus(style, b)
  );
}

/** Weapon names rated "Can't Go Wrong" for the style — the signature picks. */
function signatureWeapons(style: FightingStyle): string[] {
  return WEAPONS.filter((w) => getWeaponSuitability(w.id, style) === 'CW').map((w) => w.name);
}

function StyleChip({ style, tone }: { style: FightingStyle; tone: 'up' | 'down' }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-none text-[8px] font-black uppercase tracking-widest border-white/10',
        tone === 'up'
          ? 'text-primary border-primary/30 bg-primary/5'
          : 'text-destructive border-destructive/30 bg-destructive/5'
      )}
    >
      {STYLE_DISPLAY_NAMES[style]}
    </Badge>
  );
}

/** Winning-archetype fits for the style — Assur's winning-build taxonomy. */
function ArchetypeFitsPanel({ style }: { style: FightingStyle }) {
  const fits = STYLE_ARCHETYPE_FIT[style];
  return (
    <div className="space-y-2 pt-3 border-t border-white/5">
      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
        Winning Fits
      </span>
      <div className="flex flex-wrap gap-1">
        {fits.map((fit) => (
          <Badge
            key={fit}
            variant="outline"
            className="rounded-none text-[8px] font-black uppercase tracking-widest border-arena-gold/20 text-arena-gold/70 bg-arena-gold/5"
          >
            {WINNING_ARCHETYPES[fit].label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function MatchupPanel({ style }: { style: FightingStyle }) {
  const strong = useMemo(() => strongestAgainst(style), [style]);
  const weak = useMemo(() => weakestAgainst(style), [style]);
  return (
    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
      <div className="space-y-2">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-1.5">
          <Swords className="h-2.5 w-2.5" /> Strong vs
        </span>
        <div className="flex flex-wrap gap-1">
          {strong.length > 0 ? (
            strong.map((s) => <StyleChip key={s} style={s} tone="up" />)
          ) : (
            <span className="text-[9px] text-muted-foreground/40 italic">None recorded</span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 flex items-center gap-1.5">
          <Shield className="h-2.5 w-2.5" /> Vulnerable vs
        </span>
        <div className="flex flex-wrap gap-1">
          {weak.length > 0 ? (
            weak.map((s) => <StyleChip key={s} style={s} tone="down" />)
          ) : (
            <span className="text-[9px] text-muted-foreground/40 italic">None recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Canonical Arena-93 fighter concepts: doctrine + long-term builds. */
function ConceptsPanel({ style }: { style: FightingStyle }) {
  const guide = FIGHTER_CONCEPTS[style];
  const family = FAMILY_GUIDE[STYLE_FAMILY[style]];
  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
          Fighter Concepts
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-arena-gold/50">
          {family.label} · keys {family.keyAttributes.join(' + ')}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{guide.doctrine}</p>
      <p className="text-[10px] text-muted-foreground/50 italic leading-relaxed">
        {family.doctrine}
      </p>
      {guide.concepts.map((c) => (
        <div key={c.name} className="space-y-1 border-l-2 border-arena-gold/20 pl-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
            {c.name}
          </span>
          <p className="font-mono text-[9px] text-arena-gold/70 tracking-wide">
            {ATTRIBUTE_KEYS.map((k) => `${k} ${c.stats[k]}`).join(' · ')}
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{c.notes}</p>
          <p className="text-[9px] text-muted-foreground/50 italic leading-relaxed">
            {c.tactics}
          </p>
        </div>
      ))}
    </div>
  );
}

/** A single style's archive card: lore, hallmarks, weapons, matchup record. */
export function StyleCard({ style }: { style: FightingStyle }) {
  const entry = STYLE_COMPENDIUM[style];
  const weapons = useMemo(() => signatureWeapons(style), [style]);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-white/5 bg-white/[0.01] overflow-hidden"
    >
      <div className="p-5 border-b border-white/5 bg-secondary/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 flex items-center justify-center border border-arena-gold/30 bg-arena-gold/5 shrink-0">
            <span className="font-display font-black text-[11px] text-arena-gold">
              {STYLE_ABBREV[style]}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-black uppercase tracking-tight text-foreground text-sm truncate">
              {STYLE_DISPLAY_NAMES[style]}
            </h3>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
              {entry.archetype}
            </span>
          </div>
        </div>
        <Swords className="h-4 w-4 text-muted-foreground/20 shrink-0" />
      </div>

      <div className="p-5 space-y-5">
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{entry.description}</p>

        <div className="space-y-1.5">
          {entry.hallmarks.map((h) => (
            <div key={h} className="flex items-center gap-2">
              <span className="h-1 w-1 bg-arena-gold/60 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">
                {h}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-3 border-t border-white/5">
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
            Signature Weapons
          </span>
          <p className="text-[10px] text-foreground/70 font-medium leading-relaxed">
            {weapons.length > 0 ? weapons.join(' · ') : 'No signature weapons on record'}
          </p>
        </div>

        <ArchetypeFitsPanel style={style} />

        <MatchupPanel style={style} />

        <ConceptsPanel style={style} />

        <div className="pt-3 border-t border-white/5">
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
            Counterplay
          </span>
          <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed mt-1.5">
            {entry.counterplay}
          </p>
        </div>
      </div>
    </Surface>
  );
}
