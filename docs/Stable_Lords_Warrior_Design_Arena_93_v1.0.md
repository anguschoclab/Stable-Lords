# Stable Lords — How to Build a Better Warrior (Arena 93)

Design heuristics and example builds, adapted from the Duel2 Arena 93
newsletter article **"How to Build a Better Warrior (version Y2K)"** by Neon
Necromancer.

The article's five design axes — fighting style, longevity, weapon
suitability, physical capabilities, and trainability — are encoded as data
in `src/data/designDoctrine.ts` and scored live by
`src/engine/warrior/designReview.ts`, which powers the Warrior Builder's
Design Review panel. The three example rebuilds below ship as
`FighterConcept`s in `src/data/fighterConcepts.ts`, surfacing in the builder
preset picker, the Style Archives, and AI recruit generation.

## The Five Design Axes

- **Fighting style** — Offensive styles (lunging, slashing, striking, aimed
  blow, bashing) key on **will** (endurance, attack skills) and **strength**
  (damage, attack skills), with high wit and deftness desirable. Defensive
  styles (total parry, parry riposte, parry strike) key on **will** and
  **constitution**. Mixed styles (wall of steel, parry-lunge) key on will
  plus whatever reaches good skill cut-offs.
- **Longevity** — Decide the career length at birth. High wit learns
  fastest; high will finds easy stat trains.
- **Weapon suitability** — Be well-suited to several weapons of the style;
  it should never take more than a couple stat trains to reach a good one.
- **Physical capabilities** — Endurance, damage, and damage-taking: at
  least one at the "good" level or above. Trading strength for deftness
  usually buys more damage than the lost skills are worth.
- **Trainability** — Leave a stat a couple points below a skill breakpoint
  (deftness at 9 is the classic) and train it once skills are learned.
  Trains past 21 yield quick, significant skills.

**Canon tips:** never design an aimed-blow with less than a 21 deftness;
keep wit as low as possible on scum warriors.

## Example Rebuilds

### Lunger — "Broke Stroker"

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 8      |
| CN   | 10    | 8      |
| SZ   | 10    | 8      |
| WT   | 15    | 13     |
| WL   | 15    | 13     |
| SP   | 11    | 9      |
| DF   | 13    | 11     |

Wit and will high enough for a viable long-term warrior. Starts well-suited
to the short spear and sits one strength train from longsword suitability.
Enough con to take a hit — good damage likely arrives with the first
strength train.

### Slasher — "Scimitar Adept"

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 7      |
| CN   | 8     | 7      |
| SZ   | 14    | 12     |
| WT   | 13    | 11     |
| WL   | 17    | 14     |
| SP   | 10    | 8      |
| DF   | 13    | 11     |

Starts well-suited to the scimitar, with enough strength, constitution, and
will for normal endurance. A good shot at good damage — and if not, only a
train or two away.

### Striker — "Low-Will Wonder"

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 9     | 8      |
| SZ   | 7     | 6      |
| WT   | 17    | 14     |
| WL   | 9     | 7      |
| SP   | 14    | 12     |
| DF   | 11    | 9      |

Low will needs help reaching normal endurance — hence the high strength,
which also guarantees good damage on a relatively small warrior. The 11
deftness opens suitability to almost every weapon.

---

*Source: Duel2 Arena 93 Newsletters — Noblish Island compilation, "How to
Build a Better Warrior (version Y2K)," Neon Necromancer.*
