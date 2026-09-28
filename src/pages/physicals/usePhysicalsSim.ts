import { useMemo, useState } from 'react';
import { FightingStyle, type Warrior } from '@/types/game';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warrior/warriorStatus';
import type { FighterStats } from '@/components/stable/FighterConfigCard';

const DEFAULT_STATS: FighterStats = { strength: 10, quickness: 10, vitality: 10 };

function toAttributes(stats: FighterStats) {
  return {
    ST: stats.strength,
    SP: stats.quickness,
    CN: stats.vitality,
    SZ: 10,
    WL: 10,
    WT: 10,
    DF: 10,
  };
}

/**
 * Two-fighter simulation state: roster pickers feed A/B slots, then a
 * simplified 10-minute attrition loop projects endurance/HP outcomes from
 * derived stats. No records are kept — this is a what-if tool only.
 */
export function usePhysicalsSim() {
  const roster = useGameStore((s) => s.roster);
  const activeWarriors = useMemo(() => roster.filter((w) => isActive(w)), [roster]);

  const [styleA, setStyleA] = useState<FightingStyle>(FightingStyle.BashingAttack);
  const [styleB, setStyleB] = useState<FightingStyle>(FightingStyle.ParryRiposte);
  const [statsA, setStatsA] = useState<FighterStats>(DEFAULT_STATS);
  const [statsB, setStatsB] = useState<FighterStats>(DEFAULT_STATS);
  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);

  const handleSelectWarrior = (warrior: Warrior) => {
    // Toggle logic: first select fills A, second fills B if A is full
    if (fighterAId === warrior.id) {
      setFighterAId(null);
    } else if (fighterBId === warrior.id) {
      setFighterBId(null);
    } else if (!fighterAId) {
      setFighterAId(warrior.id);
      setStatsA({
        strength: warrior.attributes.ST,
        quickness: warrior.attributes.SP,
        vitality: warrior.attributes.CN,
      });
      setStyleA(warrior.style);
    } else {
      setFighterBId(warrior.id);
      setStatsB({
        strength: warrior.attributes.ST,
        quickness: warrior.attributes.SP,
        vitality: warrior.attributes.CN,
      });
      setStyleB(warrior.style);
    }
  };

  const simulation = useMemo(() => {
    const resultA = computeWarriorStats(toAttributes(statsA), styleA);
    const resultB = computeWarriorStats(toAttributes(statsB), styleB);

    const calcA = resultA.derivedStats;
    const calcB = resultB.derivedStats;

    let endA = calcA.endurance;
    let endB = calcB.endurance;
    let hpA = calcA.hp;
    let hpB = calcB.hp;

    let minutesPassed = 0;
    while (minutesPassed < 10 && endA > 0 && endB > 0 && hpA > 0 && hpB > 0) {
      minutesPassed++;
      const dmgA = Math.max(1, calcA.damage);
      hpB -= dmgA;
      endA -= 10;
      endB -= 5;

      if (hpB > 0) {
        const dmgB = Math.max(1, calcB.damage);
        hpA -= dmgB;
        endB -= 10;
        endA -= 5;
      }
    }

    return { calcA, calcB, endA, endB, hpA, hpB, minutesPassed };
  }, [styleA, styleB, statsA, statsB]);

  return {
    activeWarriors,
    styleA,
    setStyleA,
    styleB,
    setStyleB,
    statsA,
    setStatsA,
    statsB,
    setStatsB,
    fighterAId,
    fighterBId,
    handleSelectWarrior,
    simulation,
  };
}
