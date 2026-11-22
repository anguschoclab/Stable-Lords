# Apostrophe-clip fragments — archived 2026-05-24

Union-merge commits (notably d0a9831d3, plus follow-up merges) truncated every
lore-pool entry that contained a straight `'` apostrophe inside a single-quoted
string — the merger clipped each entry at the first `'` and dropped the tail.
One entry (`Born in a debtors' prison, raised by the wardens' charity`) was
split into two array items.

These fragment stubs were replaced in-place by their historical originals on
2026-05-24 (branch main, lore-keeper sweep). Recorded here per the
archive-don't-delete convention.

## src/engine/narrative/lore/origins.ts

- `Sold to pit-fighters by indebted parents for a week`
- `Survived a brutal childhood in the shadow of the executioner`
- `Abandoned near the butcher`
- `Abandoned in the blood-stained gutters of the Butcher`
- `Raised in the overcrowded squalor of St. Jude`
- `Born in a debtors` + orphan fragment `charity` (the two halves of one entry;
  slot refilled with a fresh origin to keep array length constant)
- `Discovered chained in a debtor`
- `Survived the sinking of the prison hulk`
- `Raised in the shadow of the executioner`
- `A nameless stowaway discovered half-drowned in a merchant ship`
- `Found shivering in a burnt-out alchemist`
- `The final, desperate offering left at the steps of the forgotten Blood God`
- `Sold to the fighting pits to settle a drunkard`
- `Abandoned at the iron grates of the Silent Brothers`
- `Raised in the fighting pits beneath the butcher`
- `Abandoned at the rusted gates of the Silent Order of St. Jude`
- `Raised in a traveling freak show, displayed as a monster until they realized the bars couldn`
- `Raised in the lightless oubliettes beneath the High Lord`

## src/engine/narrative/lore/childhoodTraits.ts

- `slept soundly only when the city`
- `learned to gauge an opponent`
- `would endure the matrons`
- `could identify every weapon in the trainer`
- `secretly practiced evasion by dodging the matron`
- `learned to read the flow of battle from watching the city watch`
- `never cried out when the overseer`
- `mastered the art of reading micro-expressions from surviving the brutal politics of the beggar king`

## src/engine/narrative/lore/definingMoments.ts

- `until they shattered a merciless overseer`
- `until they broke a slaver`
- `until they broke a corrupt warden`
- `until the day they crushed a street enforcer`
- `growing into a restless youth with a hunger for the arena`
- `now seeking the only family that ever mattered—the crowd`
- `driven by a promise made to someone who didn`
- `until they drove a splintered chair leg through a slaver` (two historical
  variants collapsed to this fragment; restored to the `…and walked free` one)
- `until they drove a shattered bottle into their tormentor`
- `until they shattered a slaver`
- `discovering that the crowd`
- `until they broke a bully`
- `until they realized the arena`
