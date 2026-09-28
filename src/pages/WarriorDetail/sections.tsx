import { Armchair, Medal, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { StatCard } from '@/components/ui/StatCard';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { isActive } from '@/engine/warrior/warriorStatus';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { cn } from '@/lib/utils';
import type { SubNavTab } from '@/components/layout/SubNav';
import type { Warrior } from '@/types/state.types';
import type { ObfuscatedWarrior } from '@/lib/obfuscation';

/** Header action cluster: bookmark, career record, grant-rudis control. */
export function DetailHeaderActions({
  warrior,
  record,
  isPlayerOwned,
  onRetire,
}: {
  warrior: Warrior;
  record: string;
  isPlayerOwned: boolean;
  onRetire: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <BookmarkButton entityType="warrior" entityId={warrior.id} size="md" />
      <div className="flex flex-col items-end px-4 border-r border-white/5">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
          Scroll of Deeds
        </span>
        <span className="font-mono font-black text-foreground text-sm">{record}</span>
      </div>
      {isPlayerOwned && isActive(warrior) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetire}
          className="gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-none border-white/10 hover:bg-destructive hover:text-primary-foreground transition-all duration-300 motion-reduce:transition-none"
        >
          <Armchair className="h-3.5 w-3.5" /> Grant Rudis
        </Button>
      )}
    </div>
  );
}

/** Tab strip for the dossier / war-plan / chronicle switch. */
export function DetailTabStrip({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: SubNavTab[];
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'relative flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 motion-reduce:transition-none',
            activeTab === tab.id
              ? 'text-primary bg-primary/5 border-b-2 border-primary -mb-px'
              : 'text-muted-foreground/40 hover:text-foreground/70 border-b-2 border-transparent -mb-px'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Right-rail surfaces: standing stats plus the blood ledger. */
export function DetailSidebar({
  displayWarrior,
  streakLabel,
  streakVal,
  champion,
}: {
  displayWarrior: ObfuscatedWarrior;
  streakLabel: string | null;
  streakVal: number;
  champion: boolean | undefined;
}) {
  return (
    <div className="lg:col-span-4 space-y-8">
      <SectionDivider label="Standing" />
      <Surface variant="glass" className="p-8 space-y-8 border-white/5">
        <div className="flex items-center justify-between">
          <StatCard
            label="Renown"
            value={displayWarrior.fame}
            variant="fame"
            valueClassName="text-3xl leading-none"
          />
          <ImperialRing size="md" variant="gold">
            <Trophy className="h-5 w-5 text-arena-fame" />
          </ImperialRing>
        </div>

        <Separator className="bg-white/5" />

        <div className="flex items-center justify-between">
          <StatCard
            label="Crowd Favor"
            value={displayWarrior.popularity}
            valueClassName="text-3xl leading-none text-arena-pop"
          />
          <ImperialRing size="md" variant="silver">
            <Users className="h-5 w-5 text-arena-pop" />
          </ImperialRing>
        </div>

        <Separator className="bg-white/5" />

        <div className="flex items-center justify-between">
          <StatCard
            label="Season Points"
            value={displayWarrior.seasonPoints ?? 0}
            valueClassName="text-3xl leading-none tabular-nums"
          />
          <ImperialRing size="md" variant="bronze">
            <Medal className="h-5 w-5 text-arena-fame" />
          </ImperialRing>
        </div>
      </Surface>

      <SectionDivider label="Blood Ledger" />
      <Surface variant="glass" className="p-8 space-y-6 border-white/5">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Bouts Fought
            </span>
            <p className="text-sm font-display font-black">
              {displayWarrior.career.wins + displayWarrior.career.losses}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Slain
            </span>
            <p className="text-sm font-display font-black text-primary">
              {displayWarrior.career.kills}
            </p>
          </div>
        </div>

        {streakLabel && (
          <div
            className={cn(
              'p-3 text-center border font-black uppercase text-[10px] tracking-[0.2em]',
              streakVal > 0
                ? 'border-primary/20 bg-primary/5 text-primary'
                : 'border-destructive/20 bg-destructive/5 text-destructive'
            )}
          >
            {streakLabel}
          </div>
        )}

        {champion && (
          <div className="p-3 text-center border border-arena-gold/20 bg-arena-gold/10 text-arena-gold font-black uppercase text-[10px] tracking-[0.2em]">
            Champion of the Arena
          </div>
        )}
      </Surface>
    </div>
  );
}
