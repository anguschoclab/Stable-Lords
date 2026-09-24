/** Probe: do playerChallenges produce player-bound bout offers? */
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { applyBackstoryToPlayer, BACKSTORY_IDS } from '@/data/backstories';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import { SeededRNGService, hashStr } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import type { WarriorId } from '@/types/shared.types';

let state = createFreshState('alpha-prime-10');
state.player.name = 'Probe';
state.player.stableName = 'Probe Stable';
applyBackstoryToPlayer(state, BACKSTORY_IDS[0], new SeededRNGService(42));
state = resolveImpacts(state, [runRankingsPass(state), runPromoterPass(state)]);
state.treasury += 5000;

const pool = [...(state.recruitPool ?? [])].sort((a, b) => a.cost - b.cost);
for (const w of pool.slice(0, 5)) {
  const rng = new SeededRNGService(state.week + hashStr(w.name));
  state.roster.push(makeWarrior(rng.uuid('warrior') as WarriorId, w.name, w.style, w.attributes, { age: w.age, potential: w.potential }));
}
const ids = new Set(state.roster.map((w) => w.id));

for (let i = 0; i < 10; i++) {
  state = await advanceWeek(state, { headless: true, mutableInput: i > 0 });

  // Issue challenges to every active, unassigned rival warrior — the bid
  // generator only iterates rivals not in their stable's trainingAssignments.
  const challengeable = state.rivals.flatMap((r) => {
    const assigned = new Set((r.trainingAssignments ?? []).map((a) => a.warriorId));
    return r.roster.filter((w) => (w.status ?? 'Active') === 'Active' && !w.isDead && !assigned.has(w.id));
  });
  if (challengeable.length > 0) {
    state.playerChallenges = challengeable.map((w) => w.id);
  }

  const mine = Object.values(state.boutOffers ?? {}).filter((o) =>
    o.warriorIds.some((id) => ids.has(id as WarriorId))
  );
  console.log(
    `absWeek=${state.absoluteWeek} treasury=${state.treasury}G offers=${Object.keys(state.boutOffers ?? {}).length} mine=${mine.length} challenges=${(state.playerChallenges ?? []).length}`
  );
  for (const o of mine.slice(0, 5)) {
    console.log(
      `    ${o.id} boutAbsWk=${boutOfferAbsoluteWeek(o)} status=${o.status} purse=${o.purse} hype=${o.hype} responses=${JSON.stringify(o.responses)}`
    );
  }
}
