import React, { useState } from 'react';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { audioManager } from '@/lib/AudioManager';
import type { FightSummary } from '@/types/combat.types';
import uiMeta from '@/data/narrative/uiMeta.json';

import { GazetteStep, InjuriesStep, BoutsStep, MathStep, MemorialStep } from './resolution-reveal';

type RevealStep = 'gazette' | 'injuries' | 'bouts' | 'math' | 'memorial';

/** Ordered header badges; medical dims when nothing happened, graveyard only on deaths. */
function StepBadges({
  step,
  hasInjuriesOrDeaths,
  hasDeaths,
}: {
  step: RevealStep;
  hasInjuriesOrDeaths: boolean;
  hasDeaths: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Badge variant={step === 'gazette' ? 'default' : 'secondary'}>1. The Gazette</Badge>
      <Badge
        variant={step === 'injuries' ? 'default' : 'secondary'}
        className={!hasInjuriesOrDeaths ? 'opacity-30' : ''}
      >
        2. Medical Report
      </Badge>
      <Badge variant={step === 'bouts' ? 'default' : 'secondary'}>3. Combat Logs</Badge>
      <Badge variant={step === 'math' ? 'default' : 'secondary'}>4. Simulation Math</Badge>
      {hasDeaths && (
        <Badge variant={step === 'memorial' ? 'destructive' : 'secondary'}>
          5. The Graveyard
        </Badge>
      )}
    </div>
  );
}

/** Advance button — label flips to honor/planning on the terminal steps. */
function NextButton({
  step,
  hasDeaths,
  onNext,
}: {
  step: RevealStep;
  hasDeaths: boolean;
  onNext: () => void;
}) {
  return (
    <div className="p-4 bg-secondary/20 border-t shrink-0 flex justify-end">
      <Button
        onClick={onNext}
        className="gap-2"
        size="lg"
        variant={step === 'memorial' ? 'destructive' : 'default'}
      >
        {step === 'math' && hasDeaths
          ? uiMeta.fanfare.btn_honor
          : step === 'math' || step === 'memorial'
            ? uiMeta.fanfare.btn_planning
            : uiMeta.fanfare.btn_next}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Resolve death names against the graveyard, preserving report order. */
function useDeadWarriors(
  data: { deaths: string[] } | undefined,
  graveyard: GameStore['graveyard']
) {
  return React.useMemo(() => {
    if (!data) return [];
    const graveyardByName = new Map<string, NonNullable<typeof graveyard>[number]>();
    for (const entry of graveyard ?? []) {
      graveyardByName.set(entry.name, entry);
    }
    const result: NonNullable<typeof graveyard>[number][] = [];
    for (const name of data.deaths) {
      const w = graveyardByName.get(name);
      if (w) result.push(w);
    }
    return result;
  }, [data, graveyard]);
}

/**
 * Resolution reveal — the weekly results stepper (gazette → medical →
 * combat logs → math → graveyard).
 */
export default function ResolutionReveal() {
  const state = useGameStore(
    useShallow((s: GameStore) => ({
      arenaHistory: s.arenaHistory,
      graveyard: s.graveyard,
      week: s.week,
      lastSimulationReport: s.lastSimulationReport,
    }))
  );
  const setState = useGameStore((s) => s.setState);
  const [step, setStep] = useState<RevealStep>('gazette');

  const latestFight = state.arenaHistory?.[state.arenaHistory.length - 1];
  const data = latestFight?.pendingResolutionData;

  const deadWarriors = useDeadWarriors(data, state.graveyard);

  if (!data) return null;

  const doClearResolution = () => {
    // Clear resolution data
    setState((draft: GameStore) => {
      draft.arenaHistory = draft.arenaHistory.map((f: FightSummary, i: number) =>
        i === draft.arenaHistory.length - 1 ? { ...f, pendingResolutionData: undefined } : f
      );
    });
  };
  const hasInjuriesOrDeaths = data.injuries.length > 0 || data.deaths.length > 0;

  const handleNext = () => {
    audioManager.play('ui_click');
    if (step === 'gazette') {
      setStep(hasInjuriesOrDeaths ? 'injuries' : 'bouts');
    } else if (step === 'injuries') {
      setStep('bouts');
    } else if (step === 'bouts') {
      setStep('math');
    } else if (step === 'math' && data.deaths.length > 0) {
      setStep('memorial');
    } else {
      doClearResolution();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-border/50 overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-display font-bold">
                {uiMeta.fanfare.resolution_title}
              </CardTitle>
              <CardDescription>Week {state.week - 1} Results</CardDescription>
            </div>
            <StepBadges
              step={step}
              hasInjuriesOrDeaths={hasInjuriesOrDeaths}
              hasDeaths={data.deaths.length > 0}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <AnimatePresence mode="wait">
            {step === 'gazette' && <GazetteStep gazette={data.gazette} />}
            {step === 'injuries' && <InjuriesStep injuries={data.injuries} deaths={data.deaths} />}
            {step === 'bouts' && <BoutsStep bouts={data.bouts} />}
            {step === 'math' && <MathStep lastSimulationReport={state.lastSimulationReport} />}
            {step === 'memorial' && <MemorialStep deadWarriors={deadWarriors} />}
          </AnimatePresence>
        </CardContent>

        <NextButton step={step} hasDeaths={data.deaths.length > 0} onNext={handleNext} />
      </Card>
    </div>
  );
}
