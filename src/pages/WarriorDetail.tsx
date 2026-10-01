/**
 * Stable Lords — Warrior Detail
 * Deep dive into a single warrior's stats, history, and equipment.
 */
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, ScrollText, User } from 'lucide-react';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { computeStreaks } from '@/engine/gazette/gazetteDetections';
import { DEFAULT_LOADOUT } from '@/data/equipment';
import { type SubNavTab } from '@/components/layout/SubNav';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { useWarriorDetail } from '@/pages/WarriorDetail/hooks/useWarriorDetail';

// Modularized Warrior Components
import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';
import { BiometricsTab } from '@/components/warrior/BiometricsTab';
import { MissionControlTab } from '@/components/warrior/MissionControlTab';
import { ChronicleTab } from '@/components/warrior/ChronicleTab';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { DetailHeaderActions, DetailTabStrip, DetailSidebar } from '@/pages/WarriorDetail/sections';

const TABS: SubNavTab[] = [
  { id: 'biometrics', label: 'DOSSIER', icon: <User className="h-4 w-4" /> },
  { id: 'mission', label: 'WAR PLAN', icon: <Target className="h-4 w-4" /> },
  { id: 'chronicle', label: 'CHRONICLE', icon: <ScrollText className="h-4 w-4" /> },
];

/** Not-found guard render. */
function UnknownWarrior() {
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

/** Active-tab body: biometrics / war plan / chronicle. */
function DetailTabBody({
  activeTab,
  warrior,
  displayWarrior,
  arenaHistory,
  currentPlan,
  currentLoadout,
  onPlanChange,
  onEquipmentChange,
}: {
  activeTab: string;
  warrior: import('@/types/game').Warrior;
  displayWarrior: import('@/lib/obfuscation').ObfuscatedWarrior;
  arenaHistory: import('@/types/game').FightSummary[];
  currentPlan: import('@/types/game').FightPlan;
  currentLoadout: import('@/data/equipment').EquipmentLoadout;
  onPlanChange: (p: import('@/types/game').FightPlan) => void;
  onEquipmentChange: (l: import('@/data/equipment').EquipmentLoadout) => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      {activeTab === 'biometrics' && (
        <BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />
      )}

      {activeTab === 'mission' && (
        <MissionControlTab
          warrior={warrior}
          currentPlan={currentPlan}
          currentLoadout={currentLoadout}
          onPlanChange={onPlanChange}
          onEquipmentChange={onEquipmentChange}
        />
      )}

      {activeTab === 'chronicle' && <ChronicleTab warrior={warrior} arenaHistory={arenaHistory} />}
    </div>
  );
}

/**
 * Warrior detail.
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
    arenaCrowns,
    insightTokens,
    handlePlanChange,
    handleRetire,
    handleEquipmentChange,
  } = useWarriorDetail();

  if (!warrior || !displayWarrior) return <UnknownWarrior />;

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
          <DetailHeaderActions
            warrior={warrior}
            record={record}
            isPlayerOwned={isPlayerOwned}
            onRetire={handleRetire}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <DetailMainColumn
          warrior={warrior}
          displayWarrior={displayWarrior}
          record={record}
          streakLabel={streakLabel}
          streakVal={streakVal}
          id={id}
          isPlayerOwned={isPlayerOwned}
          insightTokens={insightTokens}
          arenaCrowns={arenaCrowns}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          arenaHistory={arenaHistory}
          currentPlan={currentPlan}
          currentLoadout={currentLoadout}
          onPlanChange={handlePlanChange}
          onEquipmentChange={handleEquipmentChange}
        />

        <DetailSidebar
          displayWarrior={displayWarrior}
          streakLabel={streakLabel}
          streakVal={streakVal}
          champion={warrior.champion}
        />
      </div>
    </PageFrame>
  );
}

/** Main column: hero header, tab strip, and the active tab body. */
function DetailMainColumn({
  warrior,
  displayWarrior,
  record,
  streakLabel,
  streakVal,
  id,
  isPlayerOwned,
  insightTokens,
  arenaCrowns,
  activeTab,
  setActiveTab,
  arenaHistory,
  currentPlan,
  currentLoadout,
  onPlanChange,
  onEquipmentChange,
}: {
  warrior: NonNullable<ReturnType<typeof useWarriorDetail>['warrior']>;
  displayWarrior: NonNullable<ReturnType<typeof useWarriorDetail>['displayWarrior']>;
  record: string;
  streakLabel: string | null;
  streakVal: number;
  currentPlan: import('@/types/game').FightPlan;
  currentLoadout: import('@/data/equipment').EquipmentLoadout;
  onPlanChange: (p: import('@/types/game').FightPlan) => void;
  onEquipmentChange: (l: import('@/data/equipment').EquipmentLoadout) => void;
} & Pick<
  ReturnType<typeof useWarriorDetail>,
  | 'id'
  | 'isPlayerOwned'
  | 'insightTokens'
  | 'arenaCrowns'
  | 'activeTab'
  | 'setActiveTab'
  | 'arenaHistory'
>) {
  return (
    <div className="lg:col-span-8 space-y-8">
      <WarriorHeroHeader
        warrior={displayWarrior}
        record={record}
        streakLabel={streakLabel}
        streakVal={streakVal}
        id={id}
        isPlayerOwned={isPlayerOwned}
        insightTokens={insightTokens}
        arenaCrowns={arenaCrowns}
      />

      <DetailTabStrip tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />
      <DetailTabBody
        activeTab={activeTab}
        warrior={warrior}
        displayWarrior={displayWarrior}
        arenaHistory={arenaHistory}
        currentPlan={currentPlan}
        currentLoadout={currentLoadout}
        onPlanChange={onPlanChange}
        onEquipmentChange={onEquipmentChange}
      />
    </div>
  );
}
