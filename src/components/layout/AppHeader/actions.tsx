import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  RotateCcw,
  LogOut,
  Save,
  ScrollText,
  Volume2,
  VolumeX,
  MoreHorizontal,
} from 'lucide-react';
import { PrimaryCtaButton } from '@/components/layout/PrimaryCtaButton';
import { audioManager } from '@/lib/AudioManager';
import { useArenaPreferences, useGameStore } from '@/state/useGameStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function EventLogButton() {
  const eventLogOpen = useGameStore((s) => s.eventLogOpen);
  const toggleEventLog = useGameStore((s) => s.toggleEventLog);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black motion-reduce:transition-none"
          onClick={toggleEventLog}
          aria-label={eventLogOpen ? 'Close arena feed' : 'Open arena feed'}
          aria-pressed={eventLogOpen}
        >
          <ScrollText
            className={cn('h-4 w-4', eventLogOpen ? 'text-primary' : 'text-muted-foreground')}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
      >
        Arena Feed
      </TooltipContent>
    </Tooltip>
  );
}

function MuteButton() {
  const isMuted = !useArenaPreferences().audioEnabled;
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);

  const toggleMute = () => {
    setArenaPreferences({ audioEnabled: isMuted });
    void audioManager.setMuted(isMuted);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black motion-reduce:transition-none"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-destructive" />
          ) : (
            <Volume2 className="h-4 w-4 text-primary" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
      >
        Toggle Sound ({isMuted ? 'Muted' : 'Active'})
      </TooltipContent>
    </Tooltip>
  );
}

interface SaveButtonProps {
  lastSavedAt: string | null;
}

function SaveButton({ lastSavedAt }: SaveButtonProps) {
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    if (!lastSavedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- timer-based flash animation
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 1500);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  const formatSaveTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 rounded-none transition-all motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black',
            saveFlash ? 'bg-primary/20 text-primary scale-110' : 'hover:bg-white/5'
          )}
          aria-label={lastSavedAt ? `Auto-Saved at ${formatSaveTime(lastSavedAt)}` : 'Not Saved'}
        >
          <Save className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
      >
        {lastSavedAt ? `Auto-Saved: ${formatSaveTime(lastSavedAt)}` : 'Not Saved'}
      </TooltipContent>
    </Tooltip>
  );
}

interface ResetButtonProps {
  onResetPrompt: () => void;
}

function ResetButton({ onResetPrompt }: ResetButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1 focus-visible:ring-offset-black motion-reduce:transition-none"
          onClick={onResetPrompt}
          aria-label="Expunge Ledger"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
      >
        Expunge Ledger (Delete Save)
      </TooltipContent>
    </Tooltip>
  );
}

interface ExitButtonProps {
  isSimulating: boolean;
  returnToTitle: () => void;
}

function ExitButton({ isSimulating, returnToTitle }: ExitButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black motion-reduce:transition-none"
          onClick={returnToTitle}
          disabled={isSimulating}
          aria-label="Exit to title"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10"
      >
        Exit to Title
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Header actions props.
 */
interface SessionControlsSheetProps {
  isSimulating: boolean;
  lastSavedAt: string | null;
  onResetPrompt: () => void;
  returnToTitle: () => void;
}

/** Compact-width session controls: one labelled sheet instead of five icons. */
function SessionControlsSheet({
  isSimulating,
  lastSavedAt,
  onResetPrompt,
  returnToTitle,
}: SessionControlsSheetProps) {
  const [open, setOpen] = useState(false);
  const isMuted = !useArenaPreferences().audioEnabled;
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);

  const toggleMute = () => {
    setArenaPreferences({ audioEnabled: isMuted });
    void audioManager.setMuted(isMuted);
  };
  const runAndClose = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none hover:bg-white/5"
          aria-label="Open session controls"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 border-l border-white/10 bg-background">
        <SheetHeader>
          <SheetTitle className="font-display uppercase tracking-widest">
            Session Controls
          </SheetTitle>
          <SheetDescription>
            {lastSavedAt
              ? `Auto-saved ${new Date(lastSavedAt).toLocaleTimeString()}`
              : 'Not saved yet'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" className="justify-start" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Unmute audio' : 'Mute audio'}
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => runAndClose(onResetPrompt)}
          >
            <RotateCcw className="h-4 w-4" /> Expunge Ledger
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            disabled={isSimulating}
            onClick={() => runAndClose(returnToTitle)}
          >
            <LogOut className="h-4 w-4" /> Exit to title
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface HeaderActionsProps {
  compact?: boolean;
  isSimulating: boolean;
  lastSavedAt: string | null;
  onResetPrompt: () => void;
  returnToTitle: () => void;
}

/**
 * Header actions.
 */
export function HeaderActions({
  compact = false,
  isSimulating,
  lastSavedAt,
  onResetPrompt,
  returnToTitle,
}: HeaderActionsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <PrimaryCtaButton />
        <EventLogButton />
        <SessionControlsSheet
          isSimulating={isSimulating}
          lastSavedAt={lastSavedAt}
          onResetPrompt={onResetPrompt}
          returnToTitle={returnToTitle}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <PrimaryCtaButton />
      <Separator orientation="vertical" className="h-6 bg-white/5" />
      <EventLogButton />
      <MuteButton />
      <SaveButton lastSavedAt={lastSavedAt} />
      <ResetButton onResetPrompt={onResetPrompt} />
      <Separator orientation="vertical" className="h-6 bg-white/5 mx-1" />
      <ExitButton isSimulating={isSimulating} returnToTitle={returnToTitle} />
    </div>
  );
}
