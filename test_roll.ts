import { generateTraits, TRAITS } from './src/engine/traits';
import { SeededRNGService } from './src/utils/random';

const rng = new SeededRNGService(1);
const rolled = new Set();
for (let i = 0; i < 10000; i++) {
    const t = generateTraits(rng, 'agile');
    t.forEach(tid => rolled.add(tid));
}
console.log("Did we roll the new traits?", {
    orphan: rolled.has('orphan_of_the_pit'),
    frenzy: rolled.has('gutter_blood_frenzy'),
    instinct: rolled.has('feral_instinct_awakened')
});
console.log("Note: Exceptional traits aren't rolled at birth by default according to traitGeneration.ts (they are earned through training)");
