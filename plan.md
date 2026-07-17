1. **Curate Duplicate Content (CHILDHOOD_TRAITS)**
   - Run the following to create and execute `update_lore.cjs`:
     ```bash
     cat << 'EOF' > update_lore.cjs
     const fs = require('fs');
     const file = 'src/engine/narrative/loreGenerator.ts';
     let content = fs.readFileSync(file, 'utf8');
     content = content.replace(/  'was caught sharpening bone fragments into makeshift shivs',\n/g, '');
     fs.writeFileSync(file, content);
     EOF
     node update_lore.cjs
     rm update_lore.cjs
     ```
   - Update `.claude/backups/narrative/lore/removed_entries.json` by running `echo '["was caught sharpening bone fragments into makeshift shivs"]' > .claude/backups/narrative/lore/removed_entries.json`.
   - Run `git diff src/engine/narrative/loreGenerator.ts` to verify the removal.

2. **Generate New Narrative Content**
   - Run the following to create and execute `add_narrative.cjs`:
     ```bash
     cat << 'EOF' > add_narrative.cjs
     const fs = require('fs');
     const file = 'src/engine/narrative/loreGenerator.ts';
     let content = fs.readFileSync(file, 'utf8');

     const newOrigins = `  'Raised in the lightless cellars of the Blackwood Orphanage',
  'Abandoned outside the fighting pits wrapped in a bloodied tunic',
  'Survived the great fire of the Lower Wards by hiding in a cistern',
  'Found wandering the ash-choked streets of the Foundry District',
  'Raised by the grim overseers of the Iron Chain workhouse',
`;
     content = content.replace(/(const ORIGINS = \[\n(?:.|\n)*?)(];)/, `$1${newOrigins}$2`);

     const newChildhood = `  'developed a terrifyingly serene smile during the most brutal beatings',
  'was known for carving the names of their enemies into their own flesh',
  'would purposefully instigate fights just to study how different people bleed',
`;
     content = content.replace(/(const CHILDHOOD_TRAITS = \[\n(?:.|\n)*?)(];)/, `$1${newChildhood}$2`);

     const newMoments = `  'waiting for the day they could paint the arena sands with the blood of their oppressors',
  'until they strangled a cruel matron with a stolen rosary',
  'now driven by a dark vow sworn over the grave of their only friend',
`;
     content = content.replace(/(const DEFINING_MOMENTS = \[\n(?:.|\n)*?)(];)/, `$1${newMoments}$2`);

     fs.writeFileSync(file, content);
     EOF
     node add_narrative.cjs
     rm add_narrative.cjs
     ```
   - Run `git diff src/engine/narrative/loreGenerator.ts` to verify the insertions.

3. **Generate New Arena Lore**
   - Run the following to create and execute `update_arenas.cjs`:
     ```bash
     cat << 'EOF' > update_arenas.cjs
     const fs = require('fs');
     const file = 'src/data/arenas.ts';
     let content = fs.readFileSync(file, 'utf8');

     const newLore = `
  {
    id: 'standard_arena_orphan_revolt',
    arenaId: 'standard_arena',
    type: 'historical_battle',
    title: 'The Orphan Revolt',
    narrative: 'A grim testament to the desperate. A group of child slaves seized weapons from the armory and fought off the guards for three hours. The stains on the eastern wall are said to be from their final stand.',
  },
  {
    id: 'charnel_pits_silent_slaughter',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Silent Slaughter',
    narrative: 'A legendary mute gladiator was finally brought down here, surrounded by the corpses of seven opponents. He never uttered a sound, even as the final blow was struck.',
  },`;
     content = content.replace(/(export const ARENA_LORE: ArenaLoreEntry\[] = \[\n)/, `$1${newLore}`);
     fs.writeFileSync(file, content);
     EOF
     node update_arenas.cjs
     rm update_arenas.cjs
     ```
   - Run `git diff src/data/arenas.ts` to verify the insertions.

4. **Add New Trait (Gutter Born)**
   - Run the following to create and execute `update_traits.cjs`:
     ```bash
     cat << 'EOF' > update_traits.cjs
     const fs = require('fs');
     const file = 'src/engine/traits.ts';
     let content = fs.readFileSync(file, 'utf8');

     const newTrait = `  gutter_born: {
    id: 'gutter_born',
    name: 'Gutter Born',
    description: 'Forged in the merciless streets. Increased decisiveness and attack in early rounds.',
    effect: { decMod: 1, attModEarly: 1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.5,
  },
`;
     content = content.replace(/(export const TRAITS: Record<string, TraitDef> = {\n)/, `$1${newTrait}`);
     fs.writeFileSync(file, content);
     EOF
     node update_traits.cjs
     rm update_traits.cjs
     ```
   - Run the following to create and execute `update_tests.cjs`:
     ```bash
     cat << 'EOF' > update_tests.cjs
     const fs = require('fs');
     const file = 'src/test/engine/traits/traitDedup.test.ts';
     let content = fs.readFileSync(file, 'utf8');
     content = content.replace(/const EXPECTED_COUNT = 108;/g, 'const EXPECTED_COUNT = 109;');
     content = content.replace(/100 baseline \+ 8 new traits/g, '100 baseline + 9 new traits');
     fs.writeFileSync(file, content);
     EOF
     node update_tests.cjs
     rm update_tests.cjs
     ```
   - Run `git diff src/engine/traits.ts` and `git diff src/test/engine/traits/traitDedup.test.ts` to verify the changes.

5. **Run Tests**
   - Run `bun test` and `bun x vitest run` to ensure all tests pass.

6. **Complete Pre Commit Steps**
   - Complete pre-commit steps to make sure proper testing, verifications, reviews and reflections are done.

7. **Submit Changes**
   - Submit the git commit with a descriptive message.
