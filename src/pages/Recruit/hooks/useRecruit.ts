import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { BASE_ROSTER_CAP } from '@/constants/roster';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/utils/random';
import { hashStr } from '@/utils/random';
import { fullRefreshPool, type PoolWarrior, type RecruitTier, REFRESH_COST } from '@/engine/recruitment';
import { canTransact } from '@/engine/economy/utils';
import { potentialRating } from '@/engine/potential';
import { revealRecruitPotential, type PotentialScoutReport } from '@/engine/recruitScouting';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { FightingStyle, Attributes, WarriorId } from '@/types/game';
import type { Warrior } from '@/types/game';
import { toast } from 'sonner';

const CUSTOM_COST = 200;

export function useRecruit() {
  const store = useGameStore();
  const { roster, treasury, rosterBonus, recruitPool, setState, deductFunds } = store;
  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);

  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());
  const [scoutReports, setScoutReports] = useState<Record<string, PotentialScoutReport>>({});

  const rosterFull = roster.length >= MAX_ROSTER;
  const [activeTiers, setActiveTiers] = useState<Set<RecruitTier>>(
    new Set(['Common', 'Promising', 'Exceptional', 'Prodigy'])
  );
  const [activeStyle, setActiveStyle] = useState<FightingStyle | 'all'>('all');
  const [sortBy, setSortBy] = useState<'cost-asc' | 'cost-desc' | 'potential-desc' | 'age-asc'>(
    'potential-desc'
  );

  const canRefresh = canTransact(treasury, REFRESH_COST);

  const handleRecruit = useCallback(
    (w: PoolWarrior, bonus: boolean = false) => {
      if (rosterFull) {
        toast.error('Roster full! Retire or release a warrior first.');
        return;
      }
      const BONUS_COST = 50;
      const totalCost = w.cost + (bonus ? BONUS_COST : 0);
      const label = `Recruit: ${w.name} (${w.tier})${bonus ? ' + signing bonus' : ''}`;
      if (!deductFunds(totalCost, label, 'recruit')) {
        toast.error(`Not enough funds! Need ${totalCost}g.`);
        return;
      }

      setState((draft: GameStore) => {
        const recruitRng = new SeededRNGService(draft.week + hashStr(w.name));
        const warrior = makeWarrior(
          recruitRng.uuid('warrior') as WarriorId,
          w.name,
          w.style,
          w.attributes,
          { age: w.age, potential: w.potential }
        );

        if (bonus) {
          warrior.xp = (warrior.xp ?? 0) + 2;
          const currentFlair = warrior.flair ?? [];
          warrior.flair = [...currentFlair, 'Eager'];
        }

        draft.roster.push(warrior);
        draft.recruitPool = (draft.recruitPool ?? []).filter((p: PoolWarrior) => p.id !== w.id);

        const items = [
          `${draft.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`,
        ];
        if (bonus)
          items.push(
            `A 50g signing bonus sealed the deal — ${w.name} arrived eager to prove themselves.`
          );
        draft.newsletter.push({
          id: String(hashStr(`${draft.week}-recruitment-${w.name}`)),
          week: draft.week,
          title: 'Recruitment',
          items,
        });

        toast.success(`${w.name} has joined your stable! (-${totalCost}g)`);
      });
    },
    [MAX_ROSTER, rosterFull, setState, deductFunds]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      if (!deductFunds(25, `Scout Potential: ${w.name}`, 'other')) {
        toast.error('Not enough gold to scout potential (need 25g).');
        return;
      }
      setScoutedIds((s) => new Set(s).add(w.id));
      const report = revealRecruitPotential(w.id, store.week, w.potential);
      setScoutReports((prev) => ({ ...prev, [w.id]: report }));
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
    },
    [deductFunds, store.week]
  );

  const handleRefresh = useCallback(() => {
    if (!deductFunds(REFRESH_COST, 'Pool refresh', 'other')) {
      toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
      return;
    }

    setState((draft: GameStore) => {
      const usedNames = new Set<string>();
      draft.roster.forEach((w: Warrior) => usedNames.add(w.name));
      draft.graveyard.forEach((w: Warrior) => usedNames.add(w.name));
      draft.retired.forEach((w: Warrior) => usedNames.add(w.name));
      (draft.rivals ?? []).forEach((r) => r.roster.forEach((w: Warrior) => usedNames.add(w.name)));

      const newPool = fullRefreshPool(draft.week, usedNames);
      draft.recruitPool = newPool;
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
    });
  }, [deductFunds, setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      if (rosterFull) {
        toast.error('Roster full!');
        return;
      }
      if (!deductFunds(CUSTOM_COST, `Custom Build: ${data.name}`, 'recruit')) {
        toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
        return;
      }

      setState((draft: GameStore) => {
        const rng = new SeededRNGService(draft.week + hashStr(data.name));
        const id = rng.uuid('warrior') as WarriorId;
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);

        draft.roster.push(warrior);

        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
      });
    },
    [setState, navigate, MAX_ROSTER, rosterFull, deductFunds]
  );

  const filteredPool = useMemo(() => {
    let pool = [...(recruitPool ?? [])];
    pool = pool.filter((w: PoolWarrior) => activeTiers.has(w.tier));
    if (activeStyle !== 'all') {
      pool = pool.filter((w: PoolWarrior) => w.style === activeStyle);
    }
    pool.sort((a: PoolWarrior, b: PoolWarrior) => {
      switch (sortBy) {
        case 'cost-asc':
          return a.cost - b.cost;
        case 'cost-desc':
          return b.cost - a.cost;
        case 'potential-desc':
          return potentialRating(b.potential) - potentialRating(a.potential);
        case 'age-asc':
          return a.age - b.age;
        default:
          return 0;
      }
    });
    return pool;
  }, [recruitPool, activeTiers, activeStyle, sortBy]);

  const toggleTier = (tier: RecruitTier) => {
    const next = new Set(activeTiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    setActiveTiers(next);
  };

  return {
    store,
    roster,
    treasury,
    MAX_ROSTER,
    rosterFull,
    activeTiers,
    activeStyle,
    sortBy,
    canRefresh,
    scoutedIds,
    scoutReports,
    filteredPool,
    recruitPool,
    setActiveStyle,
    setSortBy,
    toggleTier,
    handleRecruit,
    handleScout,
    handleRefresh,
    handleCustomCreate,
  };
}
