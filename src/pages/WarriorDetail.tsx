/**
 * Stable Lords — Warrior Detail
 * Deep dive into a single warrior's stats, history, and equipment.
 */
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Armchair, Target, ScrollText, User } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { computeStreaks } from '@/engine/gazette/gazetteDetections';
import { isActive } from '@/engine/warriorStatus';
import { DEFAULT_LOADOUT } from '@/data/equipment';
import { type SubNavTab } from '@/components/layout/SubNav';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { useWarriorDetail } from '@/pages/WarriorDetail/hooks/useWarriorDetail';

// Modularized Warrior Components
import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';
import { BiometricsTab } from '@/components/warrior/BiometricsTab';
import { MissionControlTab } from '@/components/warrior/MissionControlTab';
import { ChronicleTab } from '@/components/warrior/ChronicleTab';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';

const TABS: SubNavTab[] = [
  { id: 'biometrics', label: 'DOSSIER', icon: <User className="h-4 w-4" /> },
  { id: 'mission', label: 'WAR PLAN', icon: <Target className="h-4 w-4" /> },
  { id: 'chronicle', label: 'CHRONICLE', icon: <ScrollText className="h-4 w-4" /> },
]; /**
 * Warrior detail.
 */

/**
 *
 */
export default function WarriorDetail() {
  const {
    id,
    warrior,
    displayWarrior,
    isPlayerOwned,
    activeTab,
    setActiveTab,
    arenaHistory,
    insightTokens,
    handlePlanChange,
    handleRetire,
    handleEquipmentChange,
  } = useWarriorDetail();

  if (!warrior || !displayWarrior) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">No gladiator bears this mark.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Return to the Ludus
          </Button>
        </Link>
      </div>
    );
  }

  const currentPlan = warrior.plan ?? defaultStylePreset(warrior.style).plan;
  const currentLoadout = warrior.equipment ?? DEFAULT_LOADOUT;
  const record = `${displayWarrior.career.wins}W - ${displayWarrior.career.losses}L - ${displayWarrior.career.kills}K`;

  const streakMap = computeStreaks(arenaHistory);
  const streakVal = streakMap.get(warrior.id) ?? 0;
  const streakLabel =
    streakVal > 0
      ? `${streakVal}-Bout Reign`
      : streakVal < 0
        ? `${Math.abs(streakVal)}-Bout Slump`
        : null;

  return (
    <PageFrame maxWidth="lg" className="pb-32">
      <PageHeader
        icon={User}
        eyebrow={isPlayerOwned ? 'Your Gladiator' : 'Rival Gladiator'}
        title={displayWarrior.name}
        subtitle={`${STYLE_DISPLAY_NAMES[warrior.style as FightingStyle] || 'Unknown Style'} · ${warrior.status}`}
        actions={
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
                onClick={handleRetire}
                className="gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-none border-white/10 hover:bg-destructive hover:text-primary-foreground transition-all duration-300"
              >
                <Armchair className="h-3.5 w-3.5" /> Grant Rudis
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <WarriorHeroHeader
            warrior={displayWarrior}
            record={record}
            streakLabel={streakLabel}
            streakVal={streakVal}
            id={id}
            isPlayerOwned={isPlayerOwned}
            insightTokens={insightTokens}
          />

          <div className="flex items-center gap-1 border-b border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300',
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

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'biometrics' && (
              <BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />
            )}

            {activeTab === 'mission' && (
              <MissionControlTab
                warrior={warrior}
                currentPlan={currentPlan}
                currentLoadout={currentLoadout}
                onPlanChange={handlePlanChange}
                onEquipmentChange={handleEquipmentChange}
              />
            )}

            {activeTab === 'chronicle' && (
              <ChronicleTab warrior={warrior} arenaHistory={arenaHistory} />
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <SectionDivider label="Standing" />
          <Surface variant="glass" className="p-8 space-y-8 border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  Renown
                </span>
                <span className="font-display font-black text-3xl text-arena-fame leading-none">
                  {displayWarrior.fame}
                </span>
              </div>
              <ImperialRing size="md" variant="gold">
                <Trophy className="h-5 w-5 text-arena-fame" />
              </ImperialRing>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  Crowd Favor
                </span>
                <span className="font-display font-black text-3xl text-arena-pop leading-none">
                  {displayWarrior.popularity}
                </span>
              </div>
              <ImperialRing size="md" variant="silver">
                <Users className="h-5 w-5 text-arena-pop" />
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

            {warrior.champion && (
              <div className="p-3 text-center border border-arena-gold/20 bg-arena-gold/10 text-arena-gold font-black uppercase text-[10px] tracking-[0.2em]">
                Champion of the Arena
              </div>
            )}
          </Surface>
        </div>
      </div>
    </PageFrame>
  );
}
