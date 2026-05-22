import React, { useState } from 'react';
import { useGameStore, reconstructGameState, type GameStore } from '@/state/useGameStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { audioManager } from '@/lib/AudioManager';
import type { FightSummary } from '@/types/combat.types';
import narrativeContent from '@/data/narrativeContent.json';

import {
  GazetteStep,
  InjuriesStep,
  BoutsStep,
  MathStep,
  MemorialStep,
} from './resolution-reveal';

type RevealStep = 'gazette' | 'injuries' | 'bouts' | 'math' | 'memorial';/**
 * Resolution reveal.
 * @returns The result.
 */


export default function ResolutionReveal() {
  const store = useGameStore();
  const state = reconstructGameState(store);
  const setState = store.setState;
  const [step, setStep] = useState<RevealStep>('gazette');

  const latestFight = state.arenaHistory?.[state.arenaHistory.length - 1];
  const data = latestFight?.pendingResolutionData;

  const deadWarriors = React.useMemo(() => {
    if (!data) return [];
    return data.deaths
      .map((name: string) => state.graveyard.find((w) => w.name === name))
      .filter(Boolean);
  }, [data, state.graveyard]);

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
                {narrativeContent.fanfare.resolution_title}
              </CardTitle>
              <CardDescription>Week {state.week - 1} Results</CardDescription>
            </div>
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
              {data.deaths.length > 0 && (
                <Badge variant={step === 'memorial' ? 'destructive' : 'secondary'}>
                  5. The Graveyard
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <AnimatePresence mode="wait">
            {step === 'gazette' && <GazetteStep gazette={data.gazette} />}
            {step === 'injuries' && <InjuriesStep injuries={data.injuries} deaths={data.deaths} />}
            {step === 'bouts' && <BoutsStep bouts={data.bouts} />}
            {step === 'math' && <MathStep lastSimulationReport={state.lastSimulationReport} />}
            {step === 'memorial' && deadWarriors.length > 0 && (
              <MemorialStep deadWarriors={deadWarriors} />
            )}
          </AnimatePresence>
        </CardContent>

        <div className="p-4 bg-secondary/20 border-t shrink-0 flex justify-end">
          <Button
            onClick={handleNext}
            className="gap-2"
            size="lg"
            variant={step === 'memorial' ? 'destructive' : 'default'}
          >
            {step === 'math' && data.deaths.length > 0
              ? narrativeContent.fanfare.btn_honor
              : step === 'math' || step === 'memorial'
                ? narrativeContent.fanfare.btn_planning
                : narrativeContent.fanfare.btn_next}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
