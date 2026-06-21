import { useMemo, useCallback, useState, useEffect } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import type { Trainer } from '@/types/shared.types';
import {
  TRAINER_FOCUSES,
  TRAINER_MAX_PER_STABLE,
  FOCUS_ICONS,
  TIER_BONUS,
  TIER_COST,
  generateHiringPool,
  convertRetiredToTrainer,
  type TrainerTier,
} from '@/engine/trainers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  UserPlus,
  RefreshCw,
  Armchair,
  Zap,
  Users,
  Award,
  Skull,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { TrainerCard } from '@/components/stable/TrainerCard';
import { canTransact } from '@/engine/economy/utils';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { VeteranReassignmentDialog } from '@/components/stable/VeteranReassignmentDialog';
import { LegacyMentorsTab } from '@/components/stable/LegacyMentorsTab';
import { FallenLegendsTab } from '@/components/stable/FallenLegendsTab';

import { toast } from 'sonner';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';

/**
 * Trainers.
 */
export default function Trainers() {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  // Flat destructuring from 1.0 store
  const {
    trainers,
    hiringPool,
    week,
    retired,
    graveyard,
    treasury,
    setState,
    deductFunds,
    isBookmarked,
  } = useGameStore();

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const allTrainers = useMemo(() => trainers ?? [], [trainers]);
  const currentTrainers = useMemo(() => {
    if (!showBookmarkedOnly) return allTrainers;
    return allTrainers.filter((t) => isBookmarked('trainer', t.id));
  }, [allTrainers, showBookmarkedOnly, isBookmarked]);

  const bookmarkedCount = allTrainers.filter((t) => isBookmarked('trainer', t.id)).length;
  const currentHiringPool = useMemo(() => hiringPool ?? [], [hiringPool]);
  const canHire = currentTrainers.length < TRAINER_MAX_PER_STABLE;

  // Auto-populate hiring pool on first visit if empty
  useEffect(() => {
    if (currentHiringPool.length === 0) {
      const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
      setState((draft) => {
        draft.hiringPool = pool;
      });
    }
  }, [currentHiringPool.length, week, setState]);

  // Refresh hiring pool
  const refreshPool = useCallback(() => {
    const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
    setState((draft) => {
      draft.hiringPool = pool;
    });
    toast.success('New trainers available.');
  }, [week, setState]);

  const hireTrainer = useCallback(
    (trainer: Trainer) => {
      const cost = TIER_COST[trainer.tier as TrainerTier] ?? 50;
      if (!deductFunds(cost, `Hire: ${trainer.name}`, 'trainer')) {
        toast.error(`Not enough gold. ${trainer.name} costs ${cost}G.`);
        return;
      }
      setState((draft) => {
        draft.trainers.push(trainer);
        draft.hiringPool = draft.hiringPool.filter((t) => t.id !== trainer.id);
      });
      toast.success(`${trainer.name} has signed with your stable.`);
    },
    [deductFunds, setState]
  );

  const fireTrainer = useCallback(
    (trainerId: string) => {
      setState((draft) => {
        draft.trainers = draft.trainers.filter((t) => t.id !== trainerId);
      });
    },
    [setState]
  );

  const convertableRetired = useMemo(
    () => retired.filter((w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)),
    [retired, currentTrainers]
  );

  const convertWarrior = useCallback(
    (warriorId: string) => {
      const warrior = retired.find((w) => w.id === warriorId);
      if (!warrior) return;
      const trainer = convertRetiredToTrainer(warrior);
      setState((draft) => {
        draft.trainers.push(trainer);
      });
      toast.success(`${warrior.name} retired to coaching. Specialization: ${trainer.focus}.`);
      setConvertDialogOpen(false);
    },
    [retired, setState]
  );

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Users}
        eyebrow="Stable Staff"
        title="Trainers"
        subtitle="COACHING · DEVELOPMENT"
        actions={
          <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-none shadow-2xl">
            <div className="flex flex-col items-center border-r border-white/10 pr-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Staff Capacity
              </span>
              <span className="font-display font-black text-primary text-xl flex items-center gap-2 leading-none">
                {currentTrainers.length} <span className="opacity-20">/</span>{' '}
                {TRAINER_MAX_PER_STABLE}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Budget
              </span>
              <span className="font-display font-black text-arena-gold text-xl flex items-center gap-2 leading-none">
                {treasury.toLocaleString()}G
              </span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="current" className="space-y-12">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-14 rounded-none w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="current"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <GraduationCap className="h-4 w-4" /> Current Staff
          </TabsTrigger>
          <TabsTrigger
            value="hire"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <UserPlus className="h-4 w-4" /> Hire
          </TabsTrigger>
          <TabsTrigger
            value="mentors"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Award className="h-4 w-4" /> Legacy Mentors
          </TabsTrigger>
          <TabsTrigger
            value="legends"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Skull className="h-4 w-4" /> Fallen Legends
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="current"
          className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex justify-end">
            <BookmarkFilterToggle
              active={showBookmarkedOnly}
              onToggle={() => setShowBookmarkedOnly((v) => !v)}
              count={bookmarkedCount}
            />
          </div>
          <div className="grid grid-cols-1 gap-8">
            {currentTrainers.length === 0 ? (
              <Surface
                variant="glass"
                className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
              >
                <ImperialRing size="lg" variant="bronze" className="opacity-20">
                  <GraduationCap className="h-8 w-8" />
                </ImperialRing>
                <div className="space-y-2">
                  <h4 className="font-display font-black uppercase tracking-widest text-muted-foreground/60">
                    No Trainers
                  </h4>
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] italic max-w-sm mx-auto">
                    Hire specialists from the hiring pool to begin training your warriors.
                  </p>
                </div>
              </Surface>
            ) : (
              <div className="space-y-6">
                <SectionDivider label="Current Staff" variant="primary" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {currentTrainers.map((t) => (
                    <TrainerCard key={t.id} trainer={t} owned onFire={() => fireTrainer(t.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {currentTrainers.length > 0 && (
            <div className="space-y-8">
              <SectionDivider label="Staff Bonuses" variant="gold" />
              <Surface
                variant="glass"
                padding="none"
                className="border-white/5 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-arena-gold/40" />
                <div className="p-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12">
                  {TRAINER_FOCUSES.map((focus) => {
                    const total = currentTrainers
                      .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                      .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);

                    return (
                      total > 0 && (
                        <div
                          key={focus}
                          className="group relative flex flex-col items-center gap-6"
                        >
                          <div className="text-5xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                            {FOCUS_ICONS[focus]}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <span className="text-3xl font-display font-black text-foreground">
                                +{total}
                              </span>
                              <Zap className="h-4 w-4 text-arena-gold animate-pulse" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary transition-colors">
                              {focus}
                            </span>
                          </div>
                        </div>
                      )
                    );
                  })}
                </div>
              </Surface>
            </div>
          )}

          {convertableRetired.length > 0 && canHire && (
            <div className="mt-12">
              <Button
                onClick={() => setConvertDialogOpen(true)}
                className="w-full h-20 bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-all rounded-none flex items-center justify-center gap-6 group"
              >
                <ImperialRing
                  size="md"
                  variant="blood"
                  className="group-hover:scale-110 transition-transform"
                >
                  <Armchair className="h-5 w-5" />
                </ImperialRing>
                <div className="text-left">
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] block mb-1">
                    Retire to Coach
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest italic">
                    {convertableRetired.length} retired warriors available to coach
                  </span>
                </div>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="hire"
          className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] border border-white/5 p-8 rounded-none gap-8">
            <div className="flex items-center gap-5">
              <ImperialRing size="md" variant="blood">
                <RefreshCw className="h-5 w-5 text-primary" />
              </ImperialRing>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none mb-1.5">
                  Available Trainers
                </h3>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">
                  {currentHiringPool.length} candidates available
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refreshPool}
              className="h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-3 rounded-none border-white/10 hover:bg-white/5 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-all duration-700" />
              Refresh Pool
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {currentHiringPool.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                owned={false}
                action={
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Cost
                      </span>
                      <span className="font-display font-black text-arena-gold text-lg leading-none">
                        {TIER_COST[t.tier as TrainerTier] ?? 50}G
                      </span>
                    </div>

                    <Button
                      disabled={
                        !canHire || !canTransact(treasury, TIER_COST[t.tier as TrainerTier] ?? 50)
                      }
                      onClick={() => hireTrainer(t)}
                      className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(135,34,40,0.3)] transition-all"
                    >
                      <UserPlus className="h-4 w-4 mr-3" />
                      Hire
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mentors" className="mt-0">
          <LegacyMentorsTab currentTrainers={currentTrainers} />
        </TabsContent>

        <TabsContent value="legends" className="mt-0">
          <FallenLegendsTab graveyard={graveyard} retired={retired} />
        </TabsContent>
      </Tabs>

      {/* Convert Dialog */}
      <VeteranReassignmentDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        convertableRetired={convertableRetired}
        onConvert={convertWarrior}
      />
    </PageFrame>
  );
}
