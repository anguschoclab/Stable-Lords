import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dices, ArrowRight } from 'lucide-react';
import { randomOwnerName, randomStableName } from '@/data/names';
import { generateCrest } from '@/engine/crest/crestGenerator';
import type { CrestData } from '@/types/crest.types';
import BackstoryPicker from '@/components/startGame/BackstoryPicker';
import { BACKSTORY_IDS, type BackstoryId } from '@/data/backstories';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { FormHeader, GoldDivider, NameField, CrestPanel } from './newGameFields';

interface NewGameFormProps {
  ownerName: string;
  setOwnerName: (name: string) => void;
  stableName: string;
  setStableName: (name: string) => void;
  playerCrest: CrestData;
  setPlayerCrest: (crest: CrestData) => void;
  backstoryId: BackstoryId | null;
  setBackstoryId: (id: BackstoryId) => void;
  onBack: () => void;
  onSubmit: () => void;
  canCreate: boolean;
}

/**
 * New game form.
 * @param  - {
  owner name,
  set owner name,
  stable name,
  set stable name,
  player crest,
  set player crest,
  backstory id,
  set backstory id,
  on back,
  on submit,
  can create,
}.
 */
export default function NewGameForm({
  ownerName,
  setOwnerName,
  stableName,
  setStableName,
  playerCrest,
  setPlayerCrest,
  backstoryId,
  setBackstoryId,
  onBack,
  onSubmit,
  canCreate,
}: NewGameFormProps) {
  const randomizeCrest = () => {
    const newCrest = generateCrest({
      seed: cryptoRandomInt(0, 99999),
      philosophy: 'Balanced',
      tier: 'Established',
    });
    setPlayerCrest(newCrest);
  };

  const randomizeBackstory = () => {
    const id = BACKSTORY_IDS[cryptoRandomInt(0, BACKSTORY_IDS.length - 1)];
    if (id) {
      setBackstoryId(id);
    }
  };

  const randomizeAll = () => {
    setOwnerName(randomOwnerName());
    setStableName(randomStableName());
    randomizeCrest();
    randomizeBackstory();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <div className="relative z-10 w-full max-w-xl space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground/60 hover:text-accent text-[11px] font-black uppercase tracking-widest transition-colors duration-150 motion-reduce:transition-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETURN TO TITLE
        </button>

        <div
          className="relative p-8 space-y-7"
          style={{
            background: 'linear-gradient(145deg, var(--background) 0%, var(--card) 60%, var(--card) 100%)',
            border: '1px solid rgba(var(--oak-rgb), 0.9)',
            borderTopColor: 'rgba(var(--umber-rgb), 0.55)',
            borderLeftColor: 'rgba(var(--sepia-rgb), 0.5)',
          }}
        >
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(var(--gold-glow-rgb), 0.5) 30%, rgba(var(--gold-glow-rgb), 0.8) 50%, rgba(var(--gold-glow-rgb), 0.5) 70%, transparent)',
            }}
          />

          <FormHeader />

          <GoldDivider faint />

          <Button
            variant="outline"
            type="button"
            onClick={randomizeAll}
            title="Randomize everything"
            className="w-full h-10 gap-2 border-[rgba(var(--oak-rgb),_0.8)] bg-background hover:border-accent/40 hover:bg-accent/5 text-[11px] font-black uppercase tracking-wider"
          >
            <Dices className="h-4 w-4 text-accent/70" />
            RANDOMIZE ALL
          </Button>

          <div className="space-y-5">
            <NameField
              id="owner-name"
              label="YOUR NAME"
              placeholder="e.g. Master Thorne"
              value={ownerName}
              onChange={setOwnerName}
              maxLength={24}
              autoFocus
              onRandomize={() => setOwnerName(randomOwnerName())}
              randomizeLabel="Randomize your name"
            />

            <NameField
              id="stable-name"
              label="STABLE NAME"
              placeholder="e.g. The Iron Wolves"
              value={stableName}
              onChange={setStableName}
              maxLength={30}
              onRandomize={() => setStableName(randomStableName())}
              randomizeLabel="Randomize stable name"
            />

            <CrestPanel crest={playerCrest} onRandomize={randomizeCrest} />
          </div>

          <BackstoryPicker
            value={backstoryId}
            onChange={setBackstoryId}
            onRandomize={randomizeBackstory}
          />

          <Button
            onClick={onSubmit}
            disabled={!canCreate}
            className="w-full h-12 gap-2 font-display font-bold text-sm tracking-wider uppercase"
            size="lg"
          >
            ENTER THE ORPHANAGE
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
