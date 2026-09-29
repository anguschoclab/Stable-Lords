import { useState, useMemo, useCallback } from 'react';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { randomWarriorName } from '@/data/names';
import { useGameStore } from '@/state/useGameStore';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/game';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { clamp } from '@/utils/math';

interface UseWarriorBuilderStateDeps {
  onCreateWarrior: (data: { name: string; style: FightingStyle; attributes: Attributes }) => void;
  maxRoster: number;
  currentRosterSize: number;
}

const DEFAULT_ATTRS: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

/** Distribute ATTRIBUTE_TOTAL points at ATTRIBUTE_MIN floor, random +1..5 chunks. */
function rollRandomAttributes(): Attributes {
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = ATTRIBUTE_TOTAL - 21;
  while (pool > 0) {
    const key = ATTRIBUTE_KEYS[cryptoRandomInt(0, ATTRIBUTE_KEYS.length - 1)];
    if (!key) continue;
    const maxAdd = Math.min(pool, ATTRIBUTE_MAX - attrs[key]);
    if (maxAdd <= 0) continue;
    const add = Math.min(maxAdd, cryptoRandomInt(1, 5));
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

/**
 * Warrior-builder form state: name/style/attributes, budget checks, and
 * randomize/create actions. Random naming uses the unified generator with
 * the owner's personality + rolled style's archetype as culture context.
 */
export function useWarriorBuilderState({
  onCreateWarrior,
  maxRoster,
  currentRosterSize,
}: UseWarriorBuilderStateDeps) {
  const personality = useGameStore((s) => s.player?.personality);
  const [name, setName] = useState('');
  const [style, setStyle] = useState<FightingStyle>(FightingStyle.StrikingAttack);
  const [attrs, setAttrs] = useState<Attributes>({ ...DEFAULT_ATTRS });

  const total = useMemo(() => ATTRIBUTE_KEYS.reduce((s, k) => s + attrs[k], 0), [attrs]);
  const remaining = ATTRIBUTE_TOTAL - total;
  const isValid = remaining === 0 && name.trim().length >= 2;
  const rosterFull = currentRosterSize >= maxRoster;
  const stats = useMemo(() => computeWarriorStats(attrs, style), [attrs, style]);

  const updateAttr = useCallback((key: keyof Attributes, value: number) => {
    setAttrs((prev) => {
      const clamped = clamp(value, ATTRIBUTE_MIN, ATTRIBUTE_MAX);
      return { ...prev, [key]: clamped };
    });
  }, []);

  const randomize = useCallback(() => {
    setAttrs(rollRandomAttributes());
    const styles = Object.values(FightingStyle);
    const chosenStyle = styles[cryptoRandomInt(0, styles.length - 1)];
    if (chosenStyle) setStyle(chosenStyle);
    setName(
      randomWarriorName({
        archetype: chosenStyle ? STYLE_ARCHETYPE[chosenStyle] : undefined,
        personality,
      })
    );
  }, [personality]);

  const handleCreate = useCallback(() => {
    if (!isValid || rosterFull) return;
    onCreateWarrior({ name: name.trim().toUpperCase(), style, attributes: attrs });
    setName('');
    setAttrs({ ...DEFAULT_ATTRS });
  }, [isValid, rosterFull, name, style, attrs, onCreateWarrior]);

  return {
    name,
    setName,
    personality,
    style,
    setStyle,
    attrs,
    total,
    remaining,
    isValid,
    rosterFull,
    stats,
    updateAttr,
    randomize,
    handleCreate,
  };
}
