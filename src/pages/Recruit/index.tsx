import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Shield, Target, Search, Hammer } from 'lucide-react';
import WarriorBuilder from '@/components/WarriorBuilder';
import { RecruitCard } from '@/components/stable/RecruitCard';
import { canTransact } from '@/engine/economy/utils';
import { useRecruit } from './hooks/useRecruit';
import { RecruitFilters } from './components/RecruitFilters';

/**
 *
 */
export default function Recruit() {
  const {
    roster,
    treasury,
    MAX_ROSTER,
    rosterFull,
    activeTiers,
    activeStyle,
    sortBy,
    canRefresh,
    scoutedIds,
    scoutReports,
    filteredPool,
    recruitPool,
    setActiveStyle,
    setSortBy,
    toggleTier,
    handleRecruit,
    handleScout,
    handleRefresh,
    handleCustomCreate,
  } = useRecruit();

  return (
    <PageFrame>
      <PageHeader
        title="Recruitment"
        subtitle="STABLE · CONTRACT MARKET"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Roster Capacity
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {roster.length} / {MAX_ROSTER}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Available Gold
              </span>
              <span className="text-sm font-display font-black text-arena-gold">{treasury}G</span>
            </div>
          </div>
        }
      />

      {rosterFull && (
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
      )}

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
          <TabsTrigger
            value="scout"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Scout Market
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Custom Warrior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <RecruitFilters
              activeTiers={activeTiers}
              toggleTier={toggleTier}
              activeStyle={activeStyle}
              setActiveStyle={setActiveStyle}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onRefresh={handleRefresh}
              canRefresh={canRefresh}
            />

            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ImperialRing size="xs" variant="blood">
                    <Target className="h-3 w-3" />
                  </ImperialRing>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Showing {filteredPool.length} of {recruitPool.length} Available Recruits
                  </span>
                </div>
              </div>

              {filteredPool.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {filteredPool.map((w) => (
                    <RecruitCard
                      key={w.id}
                      warrior={w}
                      canAfford={canTransact(treasury, w.cost)}
                      rosterFull={rosterFull}
                      onRecruit={handleRecruit}
                      isScouted={scoutedIds.has(w.id)}
                      onScout={handleScout}
                      canAffordScout={canTransact(treasury, 25)}
                      canAffordBonus={canTransact(treasury, w.cost + 50)}
                      scoutReport={scoutReports[w.id]}
                    />
                  ))}
                </div>
              ) : (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Search className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      No Results
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      Broaden your filters or refresh the pool.
                    </p>
                  </div>
                </Surface>
              )}
            </div>
          </div>
        </TabsContent>

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
                Allocation: <span className="text-foreground font-black">66 Attribute Points</span>{' '}
                · Full customization available.
              </p>
            </div>
          </Surface>

          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
