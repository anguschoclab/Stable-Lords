import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Shield, Hammer } from 'lucide-react';
import WarriorBuilder from '@/components/WarriorBuilder';
import { canTransact } from '@/engine/economy/utils';
import { useRecruit } from './hooks/useRecruit';
import { ScoutMarket } from './components/ScoutMarket';
import { useRegisterCtaAction } from '@/components/layout/useRegisterCtaAction';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';

const TAB_TRIGGER_CLASS =
  'flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all motion-reduce:transition-none';

function HeaderStats({
  rosterSize,
  maxRoster,
  treasury,
}: {
  rosterSize: number;
  maxRoster: number;
  treasury: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Roster Capacity
        </span>
        <span className="text-sm font-display font-black text-foreground">
          {rosterSize} / {maxRoster}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Available Gold
        </span>
        <span className="text-sm font-display font-black text-arena-gold">{treasury}G</span>
      </div>
    </div>
  );
}

function RosterFullBanner() {
  return (
    <Surface
      variant="glass"
      className="border-destructive/30 bg-destructive/5 p-6 mb-8 flex items-center gap-6"
    >
      <ImperialRing size="sm" variant="blood">
        <Shield className="h-4 w-4 text-destructive" />
      </ImperialRing>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
          Roster Full
        </p>
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest italic">
          Retire or release a warrior before signing new recruits.
        </p>
      </div>
    </Surface>
  );
}

function CustomWarriorTab({
  onCreate,
  maxRoster,
  rosterSize,
}: {
  onCreate: Parameters<typeof WarriorBuilder>[0]['onCreateWarrior'];
  maxRoster: number;
  rosterSize: number;
}) {
  return (
    <TabsContent value="custom" className="mt-0 space-y-12 focus-visible:outline-none">
      <Surface
        variant="glass"
        className="p-8 border-primary/20 bg-primary/5 flex items-center gap-8"
      >
        <ImperialRing size="md" variant="blood">
          <Hammer className="h-5 w-5 text-primary" />
        </ImperialRing>
        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none">
            Custom Warrior
          </h3>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
            Unit Cost: <span className="text-arena-gold font-display font-black">200G</span> ·
            Allocation: <span className="text-foreground font-black">66 Attribute Points</span> ·
            Full customization available.
          </p>
        </div>
      </Surface>

      <WarriorBuilder
        onCreateWarrior={onCreate}
        maxRoster={maxRoster}
        currentRosterSize={rosterSize}
      />
    </TabsContent>
  );
}

/**
 *
 */
/** Contract-selection state + top-bar SIGN CONTRACT CTA wiring. */
function useContractCta(
  recruitPool: PoolWarrior[],
  treasury: number,
  rosterFull: boolean,
  handleRecruit: (w: PoolWarrior, bonus?: boolean) => void
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = recruitPool.find((w: PoolWarrior) => w.id === selectedId);
  const selectedAffordable = !!selected && canTransact(treasury, selected.cost);

  useRegisterCtaAction('/stable/recruit', {
    enabled: selectedAffordable && !rosterFull,
    run: () => {
      if (selected) handleRecruit(selected, false);
      setSelectedId(null);
    },
  });

  return { selectedId, setSelectedId };
}

function ScoutMarketTab({
  recruit,
  treasury,
  rosterFull,
  selectedId,
  onSelect,
}: {
  recruit: ReturnType<typeof useRecruit>;
  treasury: number;
  rosterFull: boolean;
  selectedId: string | null;
  onSelect: (p: PoolWarrior) => void;
}) {
  return (
    <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
      <ScoutMarket
        activeTiers={recruit.activeTiers}
        activeStyle={recruit.activeStyle}
        sortBy={recruit.sortBy}
        canRefresh={recruit.canRefresh}
        scoutedIds={recruit.scoutedIds}
        scoutReports={recruit.scoutReports}
        filteredPool={recruit.filteredPool}
        recruitPool={recruit.recruitPool}
        treasury={treasury}
        rosterFull={rosterFull}
        selectedId={selectedId}
        onSelect={onSelect}
        setActiveStyle={recruit.setActiveStyle}
        setSortBy={recruit.setSortBy}
        toggleTier={recruit.toggleTier}
        handleRecruit={recruit.handleRecruit}
        handleScout={recruit.handleScout}
        handleRefresh={recruit.handleRefresh}
      />
    </TabsContent>
  );
}

/**
 *
 */
export default function Recruit() {
  const recruit = useRecruit();
  const { roster, treasury, MAX_ROSTER, rosterFull, recruitPool, handleRecruit } = recruit;

  // Contract selection drives the top-bar SIGN CONTRACT CTA — disabled until
  // a recruit is picked, then signs that recruit (base contract, no bonus).
  const { selectedId, setSelectedId } = useContractCta(
    recruitPool,
    treasury,
    rosterFull,
    handleRecruit
  );

  return (
    <PageFrame>
      <PageHeader
        title="Recruitment"
        subtitle="STABLE · CONTRACT MARKET"
        actions={
          <HeaderStats rosterSize={roster.length} maxRoster={MAX_ROSTER} treasury={treasury} />
        }
      />

      {rosterFull && <RosterFullBanner />}

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
          <TabsTrigger value="scout" className={TAB_TRIGGER_CLASS}>
            Scout Market
          </TabsTrigger>
          <TabsTrigger value="custom" className={TAB_TRIGGER_CLASS}>
            Custom Warrior
          </TabsTrigger>
        </TabsList>

        <ScoutMarketTab
          recruit={recruit}
          treasury={treasury}
          rosterFull={rosterFull}
          selectedId={selectedId}
          onSelect={(p) => setSelectedId(p.id)}
        />

        <CustomWarriorTab
          onCreate={recruit.handleCustomCreate}
          maxRoster={MAX_ROSTER}
          rosterSize={roster.length}
        />
      </Tabs>
    </PageFrame>
  );
}
