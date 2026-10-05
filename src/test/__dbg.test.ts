import { it } from 'vitest';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { resolveExchange } from '@/engine/combat/resolution/resolution';
import { getArenaById } from '@/data/arenas';

it('debug bleed attribution', () => {
  const ctx = makeResolutionContext({ arenaConfig: { ...getArenaById('standard_arena'), tags: ['premium' as const] } });
  const wall = { ATT: 10, PAR: 10, DEF: 200, INI: 10, RIP: 10, DEC: 10 };
  const fA = makeFighterState({ hp: 100, skills: { ...wall } });
  const fD = makeFighterState({ label: 'D', hp: 3, bleedStacks: 5, skills: { ...wall } });
  const events = resolveExchange(ctx, fA, fD);
  console.log(JSON.stringify(events, null, 1));
  console.log('fA.hp', fA.hp, 'fD.hp', fD.hp);
});
