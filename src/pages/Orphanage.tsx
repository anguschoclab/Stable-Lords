/**
 * Stable Lords — Orphanage FTUE Flow
 * Codex Sanguis design: Roman enrollment / gladiatorial intake aesthetic
 * Dynamic warrior selection → Tutorial bout → Summary
 */
import { motion, AnimatePresence } from 'framer-motion';
import { defaultPlanForWarrior } from '@/engine';
import { useFtueFlow } from './orphanage/useFtueFlow';
import StepProgress from '@/components/orphanage/StepProgress';
import IdentityStep from '@/components/orphanage/IdentityStep';
import WarriorSelectionStep from '@/components/orphanage/WarriorSelectionStep';
import FirstBloodStep from '@/components/orphanage/FirstBloodStep';
import StoryBeginsStep from '@/components/orphanage/StoryBeginsStep';
import PlanStep from '@/components/orphanage/PlanStep';

// ─── Animation variants for step transitions ────────────────────────────────

const stepVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const stepTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // Custom cubic-bezier for smooth deceleration
};

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * Orphanage.
 */
export default function Orphanage() {
  const {
    step,
    setStep,
    stableInput,
    setStableInput,
    ownerInput,
    setOwnerInput,
    selected,
    orphanPool,
    boutResult,
    playerPlan,
    setPlayerPlan,
    planWarrior,
    rerollPool,
    toggleWarrior,
    runTutorialBout,
    finishFTUE,
    initializeStable,
    returnToTitle,
  } = useFtueFlow();

  // ─── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Atmospheric warmth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 opacity-30 torch-flicker"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(var(--ember-rgb), 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.3) 50%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Progress */}
        <StepProgress step={step} total={5} />

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
                  if (planWarrior) {
                    setPlayerPlan(defaultPlanForWarrior(planWarrior));
                  }
                  setStep(2);
                }}
              />
            </motion.div>
          )}

          {/* ── Step 2: Set the Plan ─────────────────────────────────────────────── */}
          {step === 2 && planWarrior && playerPlan && (
            <motion.div
              key="set-the-plan"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              <PlanStep
                warrior={planWarrior}
                plan={playerPlan}
                onPlanChange={setPlayerPlan}
                onBack={() => setStep(1)}
                onNext={() => {
                  runTutorialBout();
                  setStep(3);
                }}
              />
            </motion.div>
          )}

          {/* ── Step 3: First Blood ──────────────────────────────────────────────── */}
          {step === 3 && boutResult && (
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
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            </motion.div>
          )}

          {/* ── Step 4: Your Story Begins ────────────────────────────────────────── */}
          {step === 4 && (
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
