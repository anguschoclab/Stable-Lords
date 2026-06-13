import { useState, useMemo, useCallback } from 'react';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { randomWarriorName } from '@/data/names';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

interface UseWarriorBuilderStateDeps {
  onCreateWarrior: (data: { name: string; style: FightingStyle; attributes: Attributes }) => void;
  maxRoster: number;
  currentRosterSize: number;
}

export function useWarriorBuilderState({
  onCreateWarrior,
  maxRoster,
  currentRosterSize,
}: UseWarriorBuilderStateDeps) {
  const [name, setName] = useState('');
  const [style, setStyle] = useState<FightingStyle>(FightingStyle.StrikingAttack);
  const [attrs, setAttrs] = useState<Attributes>({
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
  });

  const total = useMemo(() => ATTRIBUTE_KEYS.reduce((s, k) => s + attrs[k], 0), [attrs]);
  const remaining = ATTRIBUTE_TOTAL - total;
  const isValid = remaining === 0 && name.trim().length >= 2;
  const rosterFull = currentRosterSize >= maxRoster;
  const stats = useMemo(() => computeWarriorStats(attrs, style), [attrs, style]);

  const updateAttr = useCallback((key: keyof Attributes, value: number) => {
    setAttrs((prev) => {
      const clamped = Math.max(ATTRIBUTE_MIN, Math.min(ATTRIBUTE_MAX, value));
      return { ...prev, [key]: clamped };
    });
  }, []);

  const randomize = useCallback(() => {
    const newAttrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
    let pool = ATTRIBUTE_TOTAL - 21;
    const keys = [...ATTRIBUTE_KEYS];
    while (pool > 0) {
      const idx = cryptoRandomInt(0, keys.length - 1);
      const key = keys[idx];
      if (!key) continue;
      const maxAdd = Math.min(pool, ATTRIBUTE_MAX - newAttrs[key]);
      if (maxAdd <= 0) continue;
      const add = Math.min(maxAdd, cryptoRandomInt(1, 5));
      newAttrs[key] += add;
      pool -= add;
    }
    setAttrs(newAttrs);
    const styles = Object.values(FightingStyle);
    const styleIdx = cryptoRandomInt(0, styles.length - 1);
    const chosenStyle = styles[styleIdx];
    if (chosenStyle) setStyle(chosenStyle);
    setName(randomWarriorName());
  }, []);

  const handleCreate = useCallback(() => {
    if (!isValid || rosterFull) return;
    onCreateWarrior({ name: name.trim().toUpperCase(), style, attributes: attrs });
    setName('');
    setAttrs({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
  }, [isValid, rosterFull, name, style, attrs, onCreateWarrior]);

  return {
    name,
    setName,
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
