/**
 * E.0 — Expert scouting reveals persisted NPC plans (G8).
 * `warrior.plan` is never written for rival stables at baseline, so Expert
 * scout reports silently omit suspectedOE/AL. Once signed-bout plans persist,
 * the Expert report surfaces real plan buckets — and still reports only
 * ranges/labels, never exact numbers.
 */
import { describe, it, expect } from 'vitest';
import { generateScoutReport } from '@/engine/scouting';
import { persistNPCPlans } from '@/engine/ai/plan/agentPlan';
import {
  makeGameState,
  makeRival,
  makeWarrior,
  makeBoutOffer,
} from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';

describe('Expert scouting reveals AI plan', () => {
  it('a signed-bout rival warrior yields suspectedOE/AL buckets in an Expert report', () => {
    const npcW = makeWarrior({ fame: 80 });
    const oppW = makeWarrior({ fame: 60 });
    const rival = makeRival({ roster: [npcW] });
    const oppRival = makeRival({ roster: [oppW] });
    const state = makeGameState({ rivals: [rival, oppRival] });
    const offer = makeBoutOffer({
      warriorIds: [npcW.id as never, oppW.id as never],
      status: 'Signed',
      responses: { [npcW.id]: 'Accepted', [oppW.id]: 'Accepted' } as never,
    });

    const updated = persistNPCPlans([rival, oppRival], [offer], state);
    const scouted = updated
      .find((r) => r.id === rival.id)!
      .roster.find((w) => w.id === npcW.id)!;

    const { report } = generateScoutReport(scouted, 'Expert', state.week, new SeededRNGService(1));
    expect(report.suspectedOE).toBeDefined();
    expect(report.suspectedAL).toBeDefined();
    expect(['Low', 'Medium', 'High']).toContain(report.suspectedOE);
    expect(['Low', 'Medium', 'High']).toContain(report.suspectedAL);
  });

  it('a warrior with no persisted plan yields no plan tendencies', () => {
    const npcW = makeWarrior({ fame: 80 });
    const { report } = generateScoutReport(npcW, 'Expert', 5, new SeededRNGService(1));
    expect(report.suspectedOE).toBeUndefined();
    expect(report.suspectedAL).toBeUndefined();
  });
});
