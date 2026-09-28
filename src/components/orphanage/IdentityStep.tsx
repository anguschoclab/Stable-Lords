import StepNav from '@/components/orphanage/StepNav';

interface IdentityStepProps {
  ownerInput: string;
  setOwnerInput: (value: string) => void;
  stableInput: string;
  setStableInput: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

/**
 * Identity step.
 * @param  - {
  owner input,
  set owner input,
  stable input,
  set stable input,
  on back,
  on submit,
}.
 */
export default function IdentityStep({
  ownerInput,
  setOwnerInput,
  stableInput,
  setStableInput,
  onBack,
  onSubmit,
}: IdentityStepProps) {
  return (
    <div
      className="p-7 space-y-6"
      style={{
        background: 'linear-gradient(145deg, var(--background) 0%, var(--card) 60%, var(--card) 100%)',
        border: '1px solid rgba(var(--oak-rgb), 0.9)',
        borderTopColor: 'rgba(var(--umber-rgb), 0.5)',
      }}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Establish Your Identity</h2>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
          Your name and stable name will be recorded in the Arena Ledger for all time.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="owner-name"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70"
          >
            YOUR NAME
          </label>
          <input
            id="owner-name"
            type="text"
            maxLength={24}
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
            className="w-full h-10 px-3 text-sm"
            placeholder="e.g. Master Thorne"
            style={{
              background: 'var(--background)',
              border: '1px solid rgba(var(--oak-rgb), 0.8)',
              color: 'hsl(var(--foreground))',
              outline: 'none',
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="stable-name"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70"
          >
            STABLE NAME
          </label>
          <input
            id="stable-name"
            type="text"
            maxLength={30}
            value={stableInput}
            onChange={(e) => setStableInput(e.target.value)}
            className="w-full h-10 px-3 text-sm"
            placeholder="e.g. The Iron Sentinels"
            style={{
              background: 'var(--background)',
              border: '1px solid rgba(var(--oak-rgb), 0.8)',
              color: 'hsl(var(--foreground))',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <StepNav
        onBack={onBack}
        onNext={onSubmit}
        nextLabel="Proceed"
        nextDisabled={!ownerInput.trim() || !stableInput.trim()}
        className="flex gap-3 pt-1"
      />
    </div>
  );
}
