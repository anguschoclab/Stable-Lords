/**
 * Stable Lords — Orphanage FTUE Flow
 * Codex Sanguis design: Roman enrollment / gladiatorial intake aesthetic
 * Dynamic warrior selection → Tutorial bout → Summary
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { simulateFight, defaultPlanForWarrior } from '@/engine';
import type { GameState } from '@/types/state.types';
import type { Warrior, FightSummary, WarriorId } from '@/types/game';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { generateId } from '@/utils/idUtils';
import { generateOrphanPool } from '@/data/orphanPool';
import { createBoutSummary } from '@/engine/core/fightSummaryFactory';
import { buildFTUEInitialState } from '@/components/orphanage/ftueStateBuilder';
import StepProgress from '@/components/orphanage/StepProgress';
import IdentityStep from '@/components/orphanage/IdentityStep';
import WarriorSelectionStep from '@/components/orphanage/WarriorSelectionStep';
import FirstBloodStep from '@/components/orphanage/FirstBloodStep';
import StoryBeginsStep from '@/components/orphanage/StoryBeginsStep';

// ─── Animation variants for step transitions ────────────────────────────────

const stepVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const stepTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // Custom cubic-bezier for smooth deceleration
}; /**
    * Orphanage.
    * @returns The result.
    */

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * Orphanage.
 * @returns The result.
 */
export default function Orphanage() {
  const navigate = useNavigate();
  const state = useGameStore();
  const { initializeStable, setState, returnToTitle, saveCurrentState } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || '');
  const [ownerInput, setOwnerInput] = useState(state.player.name || '');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeedValue, setPoolSeedValue] = useState(() => cryptoRandomInt(0, 999999));

  const orphanPool = useMemo(() => generateOrphanPool(8, poolSeedValue), [poolSeedValue]);

  const [boutResult, setBoutResult] = useState<{
    a: Warrior;
    d: Warrior;
    outcome: ReturnType<typeof simulateFight>;
    summary: FightSummary;
  } | null>(null);

  const rerollPool = useCallback(() => {
    setPoolSeedValue((prev) => (prev * 1103515245 + 12345) & 0x7fffffff);
    setSelected(new Set());
  }, []);

  const toggleWarrior = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedWarriors = useMemo(
    () => orphanPool.filter((w) => selected.has(w.id)),
    [selected, orphanPool]
  );

  const runTutorialBout = useCallback(() => {
    if (selectedWarriors.length < 2) return;
    const poolA = selectedWarriors[0];
    const poolB = selectedWarriors[1];
    if (!poolA || !poolB) return;
    const wA = makeWarrior(poolA.id as WarriorId, poolA.name, poolA.style, poolA.attrs);
    const wB = makeWarrior(poolB.id as WarriorId, poolB.name, poolB.style, poolB.attrs);
    const planA = defaultPlanForWarrior(wA);
    const planB = defaultPlanForWarrior(wB);
    const outcome = simulateFight(planA, planB, wA, wB);
    const tags = outcome.post?.tags ?? [];

    const summary = createBoutSummary(wA, wB, outcome, 1, {
      uuid: () => generateId(undefined, 'ftue'),
    });
    summary.flashyTags = tags;
    summary.fameDeltaA = outcome.winner === 'A' ? 1 : 0;
    summary.fameDeltaD = outcome.winner === 'D' ? 1 : 0;

    setBoutResult({ a: wA, d: wB, outcome, summary });
  }, [selectedWarriors]);

  const finishFTUE = useCallback(() => {
    const result = buildFTUEInitialState(
      state as unknown as GameState,
      selectedWarriors,
      boutResult,
      poolSeedValue
    );

    setState((draft: GameStore) => {
      draft.isFTUE = false;
      draft.ftueComplete = true;
      draft.roster = result.aliveWarriors;
      draft.graveyard = [...state.graveyard, ...result.deadWarriors];
      draft.rivals = result.rivals;
      draft.recruitPool = result.recruitPool;
      draft.arenaHistory = result.arenaHistory;
      draft.promoters = result.promoters;
      draft.boutOffers = result.boutOffers;
      draft.realmRankings = result.realmRankings;
    });
    saveCurrentState();

    // Navigate to command center after FTUE
    navigate({ to: '/command' });
  }, [state, setState, selectedWarriors, boutResult, poolSeedValue, saveCurrentState, navigate]);

  // ─── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: '#0C0806' }}
    >
      {/* Atmospheric warmth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 opacity-30 torch-flicker"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(200,140,20,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(201,151,42,0.3) 50%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Progress */}
        <StepProgress step={step} total={4} />

        {/* ── Step Content with AnimatePresence ─────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* ── Step 0: Identity ────────────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="identity"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              <IdentityStep
                ownerInput={ownerInput}
                setOwnerInput={setOwnerInput}
                stableInput={stableInput}
                setStableInput={setStableInput}
                onBack={returnToTitle}
                onSubmit={() => {
                  initializeStable(ownerInput.trim(), stableInput.trim());
                  setStep(1);
                }}
              />
            </motion.div>
          )}

          {/* ── Step 1: Choose Warriors ──────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="warrior-selection"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              <WarriorSelectionStep
                orphanPool={orphanPool}
                selected={selected}
                onToggleWarrior={toggleWarrior}
                onRerollPool={rerollPool}
                onBack={() => setStep(0)}
                onNext={() => {
                  setStep(2);
                  runTutorialBout();
                }}
              />
            </motion.div>
          )}

          {/* ── Step 2: First Blood ──────────────────────────────────────────────── */}
          {step === 2 && boutResult && (
            <motion.div
              key="first-blood"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              <FirstBloodStep
                boutResult={boutResult}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            </motion.div>
          )}

          {/* ── Step 3: Your Story Begins ────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="story-begins"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              <StoryBeginsStep onFinish={finishFTUE} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
