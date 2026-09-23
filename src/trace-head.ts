import { advanceWeek } from './engine/pipeline/services/weekPipelineService';
import { createFreshState } from './engine/factories/gameStateFactory';
import { processAIRosterManagement } from './engine/owner/roster/management';

const state = createFreshState('ai-injured-roster-test');
(state as any).rivals = [{
  id: 'rival-injured', fame: 50,
  owner: { id: 'owner-ri', name: 'O', fame: 50, stableName: 'S', renown: 5, titles: 0 },
  roster: [
    { id: 'iw1', name: 'I1', status: 'Injured', career: { wins:0, losses:0, kills:0 }, age: 20, injuries: [] },
    { id: 'iw2', name: 'I2', status: 'Injured', career: { wins:0, losses:0, kills:0 }, age: 20, injuries: [] },
  ],
  treasury: 1000, tier: 'Established', ledger: [], trainingAssignments: [],
}];
const { updatedRivals } = processAIRosterManagement(state as any);
console.log('direct management roster:', updatedRivals[0]!.roster.length, updatedRivals[0]!.roster.map(w=>w.name));
const next = await advanceWeek(state, { headless: true });
const rival = next.rivals?.find((r: any) => r.id === 'rival-injured');
console.log('after advanceWeek roster:', rival?.roster.length, rival?.roster.map((w:any)=>w.name));
