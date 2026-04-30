/**
 * Stable Lords — Warrior Detail
 * Deep dive into a single warrior's stats, history, and equipment.
 */
import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { obfuscateWarrior } from '@/lib/obfuscation';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { type FightPlan, type GameState } from '@/types/game';
import type { Warrior } from '@/types/state.types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Armchair, Target, ScrollText, User } from 'lucide-react';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { computeStreaks } from '@/engine/gazetteNarrative';
import { DEFAULT_LOADOUT, type EquipmentLoadout } from '@/data/equipment';
import { toast } from 'sonner';
import SubNav, { type SubNavTab } from '@/components/SubNav';

// Modularized Warrior Components
import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';
import { BiometricsTab } from '@/components/warrior/BiometricsTab';
import { MissionControlTab } from '@/components/warrior/MissionControlTab';
import { ChronicleTab } from '@/components/warrior/ChronicleTab';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';

const TABS: SubNavTab[] = [
  { id: 'biometrics', label: 'BIOMETRICS', icon: <User className="h-4 w-4" /> },
  { id: 'mission', label: 'MISSION CONTROL', icon: <Target className="h-4 w-4" /> },
  { id: 'chronicle', label: 'CHRONICLE', icon: <ScrollText className="h-4 w-4" /> },
];

export default function WarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  // Use the unified store hook
  const store = useGameStore();
  const {
    roster,
    graveyard,
    retired,
    rivals,
    arenaHistory,
    insightTokens,
    setState,
    renameWarrior,
    retireWarrior,
  } = store;

  const [activeTab, setActiveTab] = useState('biometrics');

  // Find warrior across all possible states
  const warrior = useMemo(() => {
    let w =
      roster.find((w) => w.id === id) ||
      graveyard.find((w) => w.id === id) ||
      retired.find((w) => w.id === id);
    if (w) return w;
    for (const rs of rivals || []) {
      w = rs.roster.find((w) => w.id === id);
      if (w) return w;
    }
    return undefined;
  }, [id, roster, graveyard, retired, rivals]);

  const isPlayerOwned = useMemo(() => {
    if (!warrior) return false;
    return !!(
      roster.find((w) => w.id === id) ||
      graveyard.find((w) => w.id === id) ||
      retired.find((w) => w.id === id)
    );
  }, [warrior, id, roster, graveyard, retired]);

  const displayWarrior = useMemo(() => {
    if (!warrior) return null;
    return obfuscateWarrior(warrior, insightTokens, isPlayerOwned);
  }, [warrior, insightTokens, isPlayerOwned]);

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      setState((draft: any) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        if (index !== -1) {
          draft.roster[index].plan = newPlan;
        }
      });
    },
    [warrior, setState]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    retireWarrior(warrior.id);
    toast.success(`${warrior.name} has been retired with honor.`);
    navigate({ to: '/' });
  }, [warrior, retireWarrior, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      setState((draft: any) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        if (index !== -1) {
          draft.roster[index].equipment = newLoadout;
        }
      });
    },
    [warrior, setState]
  );

  if (!warrior || !displayWarrior) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Warrior not found.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const currentPlan = warrior.plan ?? defaultPlanForWarrior(warrior);
  const currentLoadout = warrior.equipment ?? DEFAULT_LOADOUT;
  const record = `${displayWarrior.career.wins}W - ${displayWarrior.career.losses}L - ${displayWarrior.career.kills}K`;

  const streakMap = computeStreaks(arenaHistory);
  const streakVal = streakMap.get(displayWarrior.name) ?? 0;
  const streakLabel =
    streakVal > 0
      ? `${streakVal}W streak`
      : streakVal < 0
        ? `${Math.abs(streakVal)}L streak`
        : null;

  return (
    <PageFrame maxWidth="lg" className="pb-32">
      <PageHeader
        icon={User}
        eyebrow={isPlayerOwned ? "Registry Asset" : "External Dossier"}
        title={displayWarrior.name}
        subtitle={`${STYLE_DISPLAY_NAMES[warrior.style as FightingStyle] || 'Unknown Style'} · ${warrior.status}`}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Career Record
              </span>
              <span className="font-mono font-black text-foreground text-sm">
                {record}
              </span>
            </div>
            {isPlayerOwned && warrior.status === 'Active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetire}
                className="gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-none border-white/10 hover:bg-destructive hover:text-white transition-all duration-300"
              >
                <Armchair className="h-3.5 w-3.5" /> Decommission
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
              <BiometricsTab warrior={warrior} displayWarrior={displayWarrior as any} />
            )}

            {activeTab === 'mission' && (
              <MissionControlTab
                warrior={warrior}
                displayWarrior={displayWarrior as any}
                currentPlan={currentPlan}
                currentLoadout={currentLoadout}
                onPlanChange={handlePlanChange}
                onEquipmentChange={handleEquipmentChange}
              />
            )}

            {activeTab === 'chronicle' && <ChronicleTab warrior={warrior} arenaHistory={arenaHistory} />}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SectionDivider label="Asset Valuation" />
          <Surface variant="glass" className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Fame Factor</span>
                <span className="font-display font-black text-2xl text-arena-fame">{displayWarrior.fame}</span>
              </div>
              <Trophy className="h-8 w-8 text-arena-fame opacity-20" />
            </div>
            <Separator className="bg-white/5" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Crowd Favor</span>
                <span className="font-display font-black text-2xl text-arena-pop">{displayWarrior.popularity}</span>
              </div>
              <Users className="h-8 w-8 text-arena-pop opacity-20" />
            </div>
          </Surface>
          
          <SectionDivider label="Status Indicators" />
          <div className="flex flex-wrap gap-2">
            {streakLabel && (
              <Badge variant={streakVal > 0 ? 'default' : 'destructive'} className="text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-none">
                {streakLabel}
              </Badge>
            )}
            {warrior.champion && (
              <Badge className="bg-arena-gold text-black text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-none">
                CHAMPION
              </Badge>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
