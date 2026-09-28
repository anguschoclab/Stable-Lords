import { useArenaPreferences, useGameStore } from '@/state/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Swords, ScrollText, Volume2, Sparkles, Activity } from 'lucide-react';
import type { ArenaPreferences } from '@/state/slices/worldSlice/types';

function SettingRow({
  id,
  icon: Icon,
  label,
  description,
  stacked = false,
  children,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  /** Render the control under the label instead of beside it. */
  stacked?: boolean;
  children: React.ReactNode;
}) {
  const labelEl = (
    <Label
      htmlFor={id}
      className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Label>
  );
  if (stacked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">{labelEl}</div>
        {children}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        {labelEl}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

type SetPrefs = (patch: Partial<ArenaPreferences>) => void;

/** Default view mode dropdown. */
function ViewModeRow({ prefs, set }: { prefs: ArenaPreferences; set: SetPrefs }) {
  return (
    <SettingRow
      id="setting-default-view"
      icon={ScrollText}
      label="Default View Mode"
      description="Choose how bouts are displayed by default"
    >
      <Select
        value={prefs.defaultViewMode}
        onValueChange={(value: 'log' | 'arena') => set({ defaultViewMode: value })}
      >
        <SelectTrigger
          id="setting-default-view"
          aria-label="Default View Mode"
          className="w-40 rounded-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          <SelectItem value="arena">Arena Replay</SelectItem>
          <SelectItem value="log">Combat Log</SelectItem>
        </SelectContent>
      </Select>
    </SettingRow>
  );
}

/** Crowd volume slider with percentage readout. */
function VolumeRow({ prefs, set }: { prefs: ArenaPreferences; set: SetPrefs }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="setting-audio-volume"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
        >
          <Volume2 className="h-4 w-4" />
          Crowd Volume
        </Label>
        <span className="text-xs font-mono text-muted-foreground">
          {Math.round(prefs.audioVolume * 100)}%
        </span>
      </div>
      <Slider
        id="setting-audio-volume"
        aria-label="Crowd Volume"
        value={[prefs.audioVolume]}
        min={0}
        max={1}
        step={0.1}
        onValueChange={([value]) => set({ audioVolume: value })}
        disabled={!prefs.audioEnabled}
      />
    </div>
  );
}

/** Screen-shake intensity dropdown. */
function ShakeRow({ prefs, set }: { prefs: ArenaPreferences; set: SetPrefs }) {
  return (
    <SettingRow
      id="setting-screen-shake"
      icon={Activity}
      label="Screen Shake"
      description="Intensity of screen shake on critical hits and deaths"
      stacked
    >
      <Select
        value={prefs.screenShakeIntensity}
        onValueChange={(value: 'off' | 'low' | 'medium' | 'high') =>
          set({ screenShakeIntensity: value })
        }
        disabled={!prefs.effectsEnabled}
      >
        <SelectTrigger
          id="setting-screen-shake"
          aria-label="Screen Shake Intensity"
          className="w-full rounded-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          <SelectItem value="off">Off</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </SettingRow>
  );
}

/** The five preference controls (view mode, audio, volume, effects, shake). */
function PreferenceRows({ prefs, set }: { prefs: ArenaPreferences; set: SetPrefs }) {
  return (
    <CardContent className="space-y-6 py-6">
      <ViewModeRow prefs={prefs} set={set} />

      {/* Audio Enabled */}
      <SettingRow
        id="setting-audio-enabled"
        icon={Volume2}
        label="Arena Audio"
        description="Enable crowd reactions and ambient sounds"
      >
        <Switch
          id="setting-audio-enabled"
          aria-label="Enable Arena Audio"
          checked={prefs.audioEnabled}
          onCheckedChange={(checked) => set({ audioEnabled: checked })}
        />
      </SettingRow>

      <VolumeRow prefs={prefs} set={set} />

      {/* Effects Enabled */}
      <SettingRow
        id="setting-effects-enabled"
        icon={Sparkles}
        label="Visual Effects"
        description="Enable particles, weapon trails, and weather"
      >
        <Switch
          id="setting-effects-enabled"
          aria-label="Enable Visual Effects"
          checked={prefs.effectsEnabled}
          onCheckedChange={(checked) => set({ effectsEnabled: checked })}
        />
      </SettingRow>

      <ShakeRow prefs={prefs} set={set} />
    </CardContent>
  );
}

/**
 * Arena settings.
 */
export default function ArenaSettings() {
  const prefs = useArenaPreferences();
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);
  const set = (patch: Partial<ArenaPreferences>) => setArenaPreferences(patch);

  return (
    <Card className="rounded-none border-border/50">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Swords className="h-5 w-5 text-arena-gold" />
          ARENA_PREFERENCES
        </CardTitle>
        <CardDescription>Configure your combat replay experience</CardDescription>
      </CardHeader>

      <PreferenceRows prefs={prefs} set={set} />
    </Card>
  );
}
