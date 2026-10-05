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

type FtueFlow = ReturnType<typeof useFtueFlow>;

/** Step 0: owner + stable identity. */
function IdentityBranch({ flow }: { flow: FtueFlow }) {
  const {
    setStep,
    stableInput,
    setStableInput,
    ownerInput,
    setOwnerInput,
    initializeStable,
    returnToTitle,
  } = flow;
  return (
    <StepShell key="identity">
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
    </StepShell>
  );
}

/** Step 1: orphan warrior selection. */
function WarriorSelectionBranch({ flow }: { flow: FtueFlow }) {
  const { setStep, selected, orphanPool, setPlayerPlan, planWarrior, rerollPool, toggleWarrior } =
    flow;
  return (
    <StepShell key="warrior-selection">
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
    </StepShell>
  );
}

/** Step 2: first war-plan assignment. */
function PlanBranch({ flow }: { flow: FtueFlow }) {
  const { setStep, playerPlan, setPlayerPlan, planWarrior, runTutorialBout } = flow;
  if (!planWarrior || !playerPlan) return null;
  return (
    <StepShell key="set-the-plan">
      <PlanStep
        warrior={planWarrior}
        plan={playerPlan}
        onPlanChange={setPlayerPlan}
        onBack={() => setStep(1)}
        onNext={() => {
          void runTutorialBout().then(() => setStep(3));
        }}
      />
    </StepShell>
  );
}

/** Step 3: tutorial bout result. */
function FirstBloodBranch({ flow }: { flow: FtueFlow }) {
  const { setStep, boutResult } = flow;
  if (!boutResult) return null;
  return (
    <StepShell key="first-blood">
      <FirstBloodStep boutResult={boutResult} onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </StepShell>
  );
}

/** The five FTUE steps rendered inside AnimatePresence. */
function FtueSteps({ flow }: { flow: FtueFlow }) {
  const { step } = flow;

  return (
    <AnimatePresence mode="wait">
      {step === 0 && <IdentityBranch key="identity" flow={flow} />}
      {step === 1 && <WarriorSelectionBranch key="warrior-selection" flow={flow} />}
      {step === 2 && <PlanBranch key="set-the-plan" flow={flow} />}
      {step === 3 && <FirstBloodBranch key="first-blood" flow={flow} />}
      {step === 4 && (
        <StepShell key="story-begins">
          <StoryBeginsStep onFinish={flow.finishFTUE} />
        </StepShell>
      )}
    </AnimatePresence>
  );
}

/**
 * Orphanage.
 */
export default function Orphanage() {
  const flow = useFtueFlow();

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
        <StepProgress step={flow.step} total={5} />

        {/* ── Step Content with AnimatePresence ─────────────────────────────────── */}
        <FtueSteps flow={flow} />
      </div>
    </div>
  );
}

/** Animated wrapper shared by every FTUE step. */
function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={stepTransition}
    >
      {children}
    </motion.div>
  );
}
