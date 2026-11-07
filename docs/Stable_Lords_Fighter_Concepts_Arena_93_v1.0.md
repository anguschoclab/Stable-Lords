# Stable Lords — Long-Term Fighter Concepts (Arena 93)

Canonical per-style fighter builds, adapted from the Duel2 Arena 93 newsletter
article **"Long Term Fighter Concepts"** by Gavin Rule, mgr Faux Tides (1482).
The Parry-Riposte section additionally draws on the Arena 93 ripper articles by
Assur, Blackhawk, Neon Necromancer, Palinc, Jorja, and Cadmus — the dozen builds
below are their canonical spreads. The Slasher section draws on the Arena 93
slasher articles by Bookie, the Arcane Kid, Master Darque, Tex, Jorja, and
Talon — their canonical spreads likewise appear below. The Parry-Striker
section draws on the Arena 93 piker articles: Assur's "The Parry Strike
Style" (with its scum-piker addendum), The Priest's "Parry Strike, Another
Fun Style", and Assur's "Pikers". The Striker section draws on the Arena 93
striker articles: Assur's "Striker Guide" (the eight-man stable), Blind Man's
"Brainy Low-Will Strikers" (the pair), Sir Boyd's "The Striking Style",
Talon's "Strikers R Us" (the Biffs, the Solid, the Perfect), Tex's "Yet
Another Striker Article" (eight veterans), and the Crimson Strategist's
"Crimson Strikers" (the synthesized build). The Parry-Lunger section draws on
"The Armor Piercing Parry-Lunge", Tripwire's "Parry-Lunge" guide, and Assur's
addendum.

These are long term fighter concepts, not floor requirements — warriors can be
viable long-term with many different builds. Each spread below is shown as the
original newsletter values (Duel2's ~84-point budget) and the **scaled
70-point equivalent** used in game (`src/data/fighterConcepts.ts`). The in-game
copies drive the Warrior Builder presets, the Style Archives, and AI recruit
generation.

Rule of thumb from the source: there is no perfect warrior. Managers use
challenges and avoids — plus scouting — to pair fighters with opponents best
suited to them.

---

## Aimed-Blow

**Doctrine:** Hits unprotected spots with precision (DF). Not overly active and
primarily offensive. Suited to every offensive tactic except decisiveness;
defensively, dodge and parry.

### All-Around Aimer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 12    | 10     |
| SZ   | 9     | 8      |
| WT   | 17    | 14     |
| WL   | 15    | 13     |
| SP   | 5     | 4      |
| DF   | 15    | 12     |

Deftness covers the full favored-weapon list; speed is no factor. Moderate
activity, low-to-mid kill desire, moderate-to-high offensive effort. Parry if
forced onto defense; offensive tactics only with scouting — lunge vs. parry
styles, slash vs. lungers.

### Ironhide Marksman

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 14    | 12     |
| SZ   | 5     | 4      |
| WT   | 18    | 15     |
| WL   | 16    | 14     |
| SP   | 4     | 3      |
| DF   | 17    | 14     |

Reduced size and damage traded for wit and deftness; high constitution shrugs
off what lands and drills holes in return.

## Basher

**Doctrine:** Pressures the foe with initiative (WT + SP) and hits hard enough
to penetrate defense with superior attack. Compatible with bash and
decisiveness tactics; no defensive tactics.

### Fast Learner

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 5     | 4      |
| SZ   | 9     | 7      |
| WT   | 19    | 16     |
| WL   | 17    | 14     |
| SP   | 7     | 6      |
| DF   | 14    | 12     |

High will buys quick stat trains and shores up endurance over low
constitution. Fast learning plus deftness yields a strong attack rating with
decisiveness and initiative behind it.

### Workhorse

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 14    | 12     |
| SZ   | 9     | 8      |
| WT   | 17    | 14     |
| WL   | 15    | 12     |
| SP   | 5     | 4      |
| DF   | 11    | 9      |

Takes a beating even without the jump; heavy armor and deep endurance keep
him swinging. Few weaknesses — balanced builds outlast godlings on average.

## Lunger

**Doctrine:** Keeps moving (high AL). Surprisingly good at dodging when built
right — quick and powerful. Lunge is the signature; decisiveness only
moderately effective. Dodge works well, riposte possibly.

### Scrapper

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 13    | 11     |
| SZ   | 4     | 3      |
| WT   | 17    | 14     |
| WL   | 15    | 13     |
| SP   | 13    | 11     |
| DF   | 11    | 9      |

Small size limits carry and damage; wit holds the initiative lead. Endurance
plus speed lets him dodge around for a shot and stay offensive.

### Heavy Spear

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 10    | 8      |
| SZ   | 9     | 8      |
| WT   | 15    | 12     |
| WL   | 15    | 12     |
| SP   | 7     | 6      |
| DF   | 13    | 11     |

High strength for crippling blows; every weapon but the epee. Purely
offensive — trades the Scrapper's defensive edge for damage.

## Parry-Lunger

**Doctrine:** The parry-lunger is an attack god waiting to be born — arguably
the most diverse style in the game, fielding the scimitar, the dodge, and the
lunge-decise pairing all at once. Design for damage first (normal or better),
then wit and will 15-21 for attack, learning, and endurance; deftness 11+
feeds attack, parry, and defense together, and 15 unlocks the epee.
Constitution is the flex stat — the armor-piercing build runs it at 5 and
clings to life by luck — while speed is nearly free: initiative and parry
come from wit and deftness, not a lunger mimic's legs. Armor at or under
encumbrance; an offhand weapon over a shield for a dodge-leaning defense.
Defensively dodge is king, parry is honest early work, and both fade from the
sheet as skills mature — drop the tactics after Expert and let the natural
tools run. Hunts strikers, pikers, rippers, and slashers; stays away from
lungers and bashers while young, and respects them forever after. A fragile,
high-work style that rewards attention — never an autopilot pick.

Builds below draw on the Arena 93 parry-lunge articles: "The Armor Piercing
Parry-Lunge" (the perfect-spread design), Tripwire's "Parry-Lunge" guide
(all seven listed graduates), and Assur's addendum — the lone TV parry-lunger
that fit no model.

### All-Around Fencer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 12    | 10     |
| SZ   | 9     | 8      |
| WT   | 16    | 13     |
| WL   | 16    | 13     |
| SP   | 7     | 6      |
| DF   | 13    | 11     |

All-around capable stats; uses parry best. Takes time to develop and to
figure out how he likes to fight.

### Prodigy

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 11    | 9      |
| SZ   | 6     | 5      |
| WT   | 18    | 15     |
| WL   | 19    | 15     |
| SP   | 10    | 8      |
| DF   | 11    | 9      |

Small size helps defense; damage is the weakest point. Learns quickly — once
stat trains push toward 15s he becomes a very serious competitor. Until then,
a careful challenge strategy keeps him alive.

### Armor-Piercer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 5     | 4      |
| SZ   | 8     | 7      |
| WT   | 21    | 18     |
| WL   | 17    | 14     |
| SP   | 5     | 4      |
| DF   | 17    | 14     |

The article's perfect spread — 21 wit and 17 deftness build a massive,
pinpoint attack that renders defensive openings fruitless. Five constitution
means he clings to life by luck and trains nothing but skills from fight one.
Not for the weak of heart. Longsword with an offhand; aim head. Walls up
minute 1, then hunts at 9-9-7. Spastic 10-10-10 desperation.

### First Graduate

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 9      |
| CN   | 10    | 8      |
| SZ   | 9     | 8      |
| WT   | 17    | 14     |
| WL   | 17    | 14     |
| SP   | 4     | 3      |
| DF   | 17    | 14     |

Tripwire's first listed graduate — a VL/HI favorite rhythm behind the
scimitar. Balanced physicals and max-deftness skills are the versatile
template: nothing wasted, every tool live. Very low effort, high activity;
dodge on defense.

### Two-Time Televised

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 12    | 10     |
| SZ   | 7     | 6      |
| WT   | 21    | 18     |
| WL   | 15    | 12     |
| SP   | 5     | 4      |
| DF   | 13    | 11     |

Tripwire's strategy example and two-time tourney victor — slow on paper
(9/8/13/5/8/6) but the dodge covers it. Attack and dodge, keep the initiative
and riposte, and stay at or under encumbrance. HI/HI rhythm, longsword; open
moderate-high with dodge, bleed to low effort late.

### Parry Adept

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 9     | 8      |
| SZ   | 8     | 7      |
| WT   | 17    | 14     |
| WL   | 15    | 13     |
| SP   | 9     | 7      |
| DF   | 15    | 12     |

A one-time TV whose favorite tactic was parry — proof the style's natural
parry is real even when dodge leads the plan. Higher speed than most
parry-lungers carry. Scimitar; high-high with parry while young, tactic-free
once skills mature.

### Dodge Adept

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 13    | 11     |
| SZ   | 10    | 8      |
| WT   | 21    | 18     |
| WL   | 15    | 12     |
| SP   | 5     | 4      |
| DF   | 11    | 9      |

A one-time TV built around a dodge favorite at minimum deftness — 21 wit does
the learning while 13 constitution keeps him upright. Very low effort, high
activity. Shortsword; the dodge tactic until defense reaches Expert.

### Endless Engine

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 7     | 6      |
| CN   | 11    | 9      |
| SZ   | 13    | 11     |
| WT   | 17    | 14     |
| WL   | 21    | 18     |
| SP   | 4     | 3      |
| DF   | 11    | 9      |

The 21-will graduate: a MO/HI favorite who simply never tires. Minimal
strength means damage comes late — he outlasts instead, parrying through the
middle minutes. Short spear; moderate-high rhythm with parry; wins on
endurance.

### Low-Effort Razor

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 13    | 11     |
| SZ   | 10    | 8      |
| WT   | 15    | 13     |
| WL   | 15    | 12     |
| SP   | 7     | 6      |
| DF   | 15    | 12     |

The LO/VH graduate — lowest wit of the set, so 15 deftness carries the
accuracy. Runs at almost no offensive effort while activity stays at the top
of the range. Longsword; very low effort, very high activity; let the blade
do the work.

### Pocket Fencer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 8      |
| CN   | 12    | 10     |
| SZ   | 5     | 4      |
| WT   | 17    | 14     |
| WL   | 21    | 18     |
| SP   | 8     | 7      |
| DF   | 11    | 9      |

The compact scimitar graduate — size 5 bankrolls 21 will and a LO/MO favorite
rhythm. Defense points come free from the tiny frame; the will engine does
the rest. Scimitar; low-moderate; dodge behind the small profile.

### Assur's Outlier

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 21    | 18     |
| CN   | 12    | 10     |
| SZ   | 7     | 6      |
| WT   | 17    | 14     |
| WL   | 9     | 7      |
| SP   | 7     | 6      |
| DF   | 11    | 9      |

Assur's lone TV parry-lunger — a 21-strength brawler who fits no model and
graduated anyway. Proof the style tolerates damage-first frames Tripwire
never recommended. Anything heavy; moderate rhythm; hits hard enough to end
it early.

Small size aids defense; damage is the weak point. Learns quickly — after
stat trains toward 15s he becomes a serious competitor. Needs a careful
challenge strategy until then.

## Parry-Riposte

**Doctrine:** Superior riposte steals the initiative and strikes while the
foe is off balance. Design for damage first — a ripper who cannot hurt what
he parries loses anyway — then carrying capacity, hit points, and parry
skills. Both hybrids and scum-leaning builds graduate. Scimitar and longsword
are the staples, epee and shortsword for the deft, short spear and long spear
for low-wit recruits; keep armor light within carrying capacity. Find each
warrior's own rhythm — start near 4-6 OE/AL and experiment — with
lunge-or-nothing offensively and parry/riposte defensively. Rippers hunt
strikers and scum, die to aimed blows, and find slashers a tough out. Well
suited to lunge, less so slash, terribly to bash and decisiveness.
Defensively riposte and parry; dodge and responsiveness poorly.

### Webweaver

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 11    | 9      |
| SZ   | 6     | 5      |
| WT   | 19    | 16     |
| WL   | 18    | 15     |
| SP   | 6     | 5      |
| DF   | 15    | 12     |

High wit plus the style's riposte strength weaves a tight defensive web.
Will fuels later trains and endurance; deftness props up the lower attack
rating and unlocks the epee.

### Quicksilver

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 9     | 8      |
| SZ   | 5     | 4      |
| WT   | 17    | 14     |
| WL   | 15    | 12     |
| SP   | 14    | 12     |
| DF   | 13    | 11     |

Speed focuses the natural riposte — he often answers before the opponent
swings. Strength covers large weapons like the longsword.

### Daydream

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 14    | 12     |
| SZ   | 4     | 3      |
| WT   | 17    | 14     |
| WL   | 7     | 6      |
| SP   | 8     | 7      |
| DF   | 17    | 14     |

Assur's "best Parry Riposte ever" (Duelmasters Dog Brother): a scum-leaning
frame whose 17 strength guarantees the damage rating rippers live or die by.
High wit and deftness feed the parry game; will runs cheap once constitution
covers endurance. Low-moderate rhythm; scimitar or epee; parry, then riposte.

### Consortium Hybrid

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 21    | 17     |
| CN   | 8     | 7      |
| SZ   | 11    | 9      |
| WT   | 21    | 17     |
| WL   | 7     | 6      |
| SP   | 3     | 3      |
| DF   | 13    | 11     |

Assur's favorite design — "use again without hesitation". Maxed strength and
wit buy damage and parry skills while size carries the hit points will
cannot. Speed is nearly bottomed out; the riposte does the answering. Lunge
when a lane opens; parry/riposte behind light armor.

### Freshman Scum

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 15    | 13     |
| SZ   | 10    | 8      |
| WT   | 6     | 5      |
| WL   | 21    | 18     |
| SP   | 4     | 3      |
| DF   | 11    | 9      |

The classic scum ripper: will does the heavy lifting for endurance and stat
trains while wit stays cheap. Never quick, rarely clever — he wins on
damage, hit points, and a wall of parry. Minimal effort; riposte on the
counter.

### The Art

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 7     | 6      |
| SZ   | 7     | 6      |
| WT   | 21    | 17     |
| WL   | 13    | 11     |
| SP   | 6     | 5      |
| DF   | 21    | 17     |

Blackhawk's "perfect" ripper spends everything on wit and deftness — the two
stats that drive parry and riposte skills — then trains strength up behind
them. Fragile early, lethal once the skills arrive. Epee or shortsword; high
activity, low effort; riposte first.

### Necrom's Paragon

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 4     | 3      |
| SZ   | 5     | 4      |
| WT   | 17    | 14     |
| WL   | 21    | 18     |
| SP   | 11    | 9      |
| DF   | 17    | 14     |

The textbook "perfect" spread: tiny frame, huge will, elite wit and deftness
— epee-capable out of the gate. Constitution is the glaring hole; protect
him until stat trains close it. Epee; riposte and parry; train ST and CN
early.

### Thror's Lesson

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 10    | 8      |
| SZ   | 9     | 8      |
| WT   | 15    | 12     |
| WL   | 15    | 12     |
| SP   | 6     | 5      |
| DF   | 14    | 12     |

Necrom's real ripper — the cautionary tale. Solid across the board but
nothing elite; the early stat trains (ST, then WT) decided whether he
graduated. Rippers live and die by damage output. Scimitar; parry/riposte;
train ST before chasing skills.

### Fantasy Duelist

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 11    | 9      |
| SZ   | 11    | 9      |
| WT   | 15    | 13     |
| WL   | 15    | 13     |
| SP   | 6     | 5      |
| DF   | 15    | 12     |

Palinc's dual-wield survivor: even stats let him carry a main-gauche
off-hand without starving either skill line. Average everywhere is fine when
the riposte is doing the talking. Two weapons — scimitar plus an off-hand;
moderate rhythm.

### Dawnrain

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 13    | 11     |
| SZ   | 5     | 4      |
| WT   | 15    | 12     |
| WL   | 17    | 14     |
| SP   | 8     | 7      |
| DF   | 17    | 14     |

Jorja's Tailida — the little-damage lesson made flesh. Deft enough for any
weapon and will to spare, but 9 strength on a small frame means every
riposte lands softly; the published fix was training ST toward 14.
Low/moderate rhythm; epee or scimitar; parry-heavy early.

### Scovellie

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 13    | 11     |
| SZ   | 8     | 7      |
| WT   | 17    | 14     |
| WL   | 17    | 14     |
| SP   | 5     | 4      |
| DF   | 15    | 12     |

Cadmus's basic ripper: balanced wit, will, and deftness on a mid-size frame.
The (ST+CN)×WL endurance math comes out respectable — the baseline every
serious ripper design is measured against. Moderate effort; scimitar;
riposte the counter.

### Santee

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 7     | 6      |
| SZ   | 14    | 12     |
| WT   | 17    | 14     |
| WL   | 15    | 12     |
| SP   | 8     | 7      |
| DF   | 10    | 8      |

The size-14 outlier who proved big rippers graduate: the frame carries hit
points and damage the classic builds lack, at the cost of deftness. Jorja
ran him moderate/moderate and charted a slash favorite. Longsword;
moderate/moderate rhythm; slash on the riposte.

## Parry-Striker

**Doctrine:** The hardest style to win with — and the most flexible. Pikers
fight above their skill sheet, conserve endurance well, and pivot between
offense and defense better than any style. Wit is the keystone (17-21
canon), deftness second; average numbers make the worst style worse, so
design to an extreme. The longsword and scimitar are the staple blades;
damage matters more than the low starting skills suggest. Run 9-10 or
10-10 — decisiveness offensively, parry and responsiveness defensively —
and expect luck to matter: pikers see bonused and cursed skills more often
than any style. They hold their ground — dodge is poor.

### Counter Guard

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 9     | 8      |
| SZ   | 6     | 5      |
| WT   | 17    | 14     |
| WL   | 19    | 16     |
| SP   | 9     | 7      |
| DF   | 15    | 12     |

Defense-first build centered on parry. Strength is lower than ideal with the
small size, but high will makes it an easy train.

### Reactive Striker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 12    | 10     |
| CN   | 9     | 7      |
| SZ   | 5     | 4      |
| WT   | 17    | 14     |
| WL   | 15    | 12     |
| SP   | 14    | 12     |
| DF   | 13    | 11     |

Very responsive with a workable riposte. Higher strength opens lunger
weapons such as the longsword. Round plan: responsiveness, then parry, then
riposte, then offense.

### Assur's Champion

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 12    | 10     |
| CN   | 7     | 6      |
| SZ   | 7     | 6      |
| WT   | 21    | 18     |
| WL   | 21    | 17     |
| SP   | 5     | 4      |
| DF   | 11    | 9      |

Assur's DYO-type Tournament Champion — proof the worst style can take the
biggest prize. Wit and will both maxed for learning; eleven deftness was
the only number that mattered after wit. ALE/L or no armor on a fast frame;
9-10 or 10-10, decisiveness throughout.

### Quiet Qualifier

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 12    | 10     |
| SZ   | 4     | 3      |
| WT   | 21    | 18     |
| WL   | 7     | 6      |
| SP   | 12    | 10     |
| DF   | 11    | 9      |

Doesn't look like anything special, yet TV'd for Assur — the counterpoint
to the godling trap. A sturdy frame carried APA/F plate through the
qualifier run. 10-10 decisiveness.

### The False Godling

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 5     | 4      |
| SZ   | 10    | 8      |
| WT   | 21    | 18     |
| WL   | 17    | 14     |
| SP   | 5     | 4      |
| DF   | 11    | 9      |

Near-perfect on paper and completely mediocre in tournaments — Assur's
cautionary tale. It learns attack naturally, rolled well, and still failed.
With pikers, great stats do not ensure success.

### Eleven-Wit Scum

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 16    | 13     |
| SZ   | 5     | 4      |
| WT   | 11    | 9      |
| WL   | 21    | 18     |
| SP   | 5     | 4      |
| DF   | 11    | 9      |

Assur's scum-piker addendum — TV'd rookies and graduated 19-3. His failed
scum versions ran 3-7 wit; the one feature that separated this success was
eleven wit. Constitution and will do the tank's work.

### Priest's Edge

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 7     | 6      |
| SZ   | 11    | 9      |
| WT   | 17    | 14     |
| WL   | 16    | 13     |
| SP   | 7     | 6      |
| DF   | 11    | 9      |

The Priest's strength-led rollup — when ST runs high and DF low, the piker
fights like a striker: get the first, and only, blow in. Offensive plan:
10-10-10 decisiveness all the way through, even in desperation.

### Priest's Guard

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 7     | 6      |
| SZ   | 10    | 8      |
| WT   | 17    | 14     |
| WL   | 17    | 14     |
| SP   | 7     | 6      |
| DF   | 15    | 13     |

The Priest's deftness-led rollup — when DF runs high and ST low, speed
benefits the ability to move in reaction to the opponent. Defensive plan:
responsiveness minute one, decisiveness from minute two, responsiveness in
desperation.

### Shell Piker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 18    | 15     |
| SZ   | 17    | 14     |
| WT   | 3     | 3      |
| WL   | 16    | 13     |
| SP   | 6     | 5      |
| DF   | 7     | 6      |

Assur forcing a hopeless roll-up into a style — low wit and deftness made
offense impossible, so the choice came down to eleven deftness or hit
points. He chose hit points: a size-17, CN-18 mountain that simply refuses
to fall.

### Easy Design

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 8      |
| CN   | 13    | 11     |
| SZ   | 12    | 10     |
| WT   | 21    | 18     |
| WL   | 9     | 7      |
| SP   | 6     | 5      |
| DF   | 13    | 11     |

The easiest piker in the Pikers article — twenty-one wit is clear, nine
will, eleven-plus deftness, the leftover points to strength. A learner
built to outgrow the style's weak starting skills.

### Burning Piker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 8     | 7      |
| SZ   | 16    | 13     |
| WT   | 5     | 4      |
| WL   | 19    | 16     |
| SP   | 14    | 12     |
| DF   | 9     | 7      |

A strange hybrid burner — a lunger-shaped roll-up forced into a piker.
Nineteen will for the two-train burn to twenty-one, nine deftness for the
breakpoint; after burns he reads 15-10-16-7-21-14-11 behind a battle axe.

### Wit Burn

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 7     | 6      |
| CN   | 9     | 8      |
| SZ   | 9     | 7      |
| WT   | 16    | 13     |
| WL   | 20    | 17     |
| SP   | 13    | 11     |
| DF   | 10    | 8      |

The exciting alternative to the solid 17-17-11 spread — sixteen wit,
twenty will, thirteen speed; burns to 9-10-9-17-21-13-11 and learns
everything the style refuses to start with.

### Attack Cutter

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14     |
| CN   | 4     | 3      |
| SZ   | 8     | 7      |
| WT   | 15    | 13     |
| WL   | 11    | 9      |
| SP   | 12    | 10     |
| DF   | 17    | 14     |

Low constitution screams pure offensive, so Assur maxed attack skills at
creation and counted on natural learning to deliver the decisiveness.
10-10 decisiveness; strike first — the tank is too thin for the long fight.

## Slasher

**Doctrine:** A finesse offense — attack and initiative over defense, but it
burns endurance fast, so win early or fade. The scimitar is the cornerstone
blade: a design that cannot reach ST 9, WT 11, DF 11 within a couple of
trains is better run as a striker; shortsword, hatchet, broadsword, battle
axe, longsword, great axe, and epee all suit. Stack wit, will, and deftness —
keep size small and constitution cheap, and never spend on speed. Run high
offensive effort while the arms last, let activity collapse low by mid-bout,
and slash only — best run untamed. Slashers eat lungers, hang with bashers
and walls, respect decisive strikers, and dread the long-haul scum.

### Glass Reaper

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 6     | 5      |
| SZ   | 6     | 5      |
| WT   | 19    | 16     |
| WL   | 15    | 13     |
| SP   | 10    | 8      |
| DF   | 17    | 14     |

Lacks defensive skills and can't always land first — decisive fighters are
his bane, though he eats lungers. Wit and deftness build a strong attack;
speed keeps initiative control. Heavier armor early until skills mature.

### Juggernaut

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 15    | 13     |
| SZ   | 6     | 5      |
| WT   | 15    | 13     |
| WL   | 17    | 14     |
| SP   | 5     | 4      |
| DF   | 15    | 12     |

The tougher build: doesn't need the first shot, wears stout armor, goes all
out on great endurance. Excellent long-term slasher with a good skill base
and easy stat trains.

### Scimitar Adept

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
will for normal endurance. A good shot at good damage out of the gate — and
if not, only a train or two away.

### Sacred Lord

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 7     | 6      |
| SZ   | 7     | 6      |
| WT   | 17    | 14     |
| WL   | 17    | 14     |
| SP   | 9     | 8      |
| DF   | 16    | 13     |

Bookie's baseline-perfect slasher: wit, will, and deftness all elite so
attack and initiative max out, speed just high enough to keep tempo honest.
Strength buys the scimitar at creation and the broadsword after a train or
two — his defense is not being there.

### Arcane Slasher

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 6     | 5      |
| CN   | 3     | 4      |
| SZ   | 11    | 9      |
| WT   | 15    | 12     |
| WL   | 21    | 17     |
| SP   | 11    | 9      |
| DF   | 17    | 14     |

The Arcane Kid's will-over-flesh answer to the burn problem — constitution
nearly bottomed so will does all the work and never tires of attacking.
Deft enough for the scimitar from day one; keep him out of heavy armor until
the trains land.

### Darque Slasher

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 10    | 8      |
| SZ   | 7     | 6      |
| WT   | 17    | 14     |
| WL   | 17    | 14     |
| SP   | 9     | 8      |
| DF   | 11    | 9      |

Master Darque's compact bruiser — deftness deliberately bottomed because the
style needs almost no defense; strength buys the heavy blades and the damage
that ends fights before the endurance bill comes due.

### Unbiased Slasher

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 7     | 6      |
| CN   | 9     | 8      |
| SZ   | 5     | 4      |
| WT   | 21    | 17     |
| WL   | 18    | 15     |
| SP   | 11    | 9      |
| DF   | 13    | 11     |

Tex's tiny razor — size five with wit twenty-one: learn everything, carry
nothing, dodge with deftness. Proof that a slasher can be small and still
win early enough for it not to matter.

### Profile Slasher

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9     | 8      |
| CN   | 7     | 6      |
| SZ   | 15    | 13     |
| WT   | 17    | 14     |
| WL   | 15    | 12     |
| SP   | 10    | 8      |
| DF   | 11    | 9      |

Jorja's graduate Vic — a size-fifteen slasher who proved the archetype
flexible: the big frame carries hit points and damage while wit and will
cover skills and endurance. Ran him attacking the right arm, protecting the
body.

### Anti-Thesis

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 11    | 9      |
| SZ   | 12    | 10     |
| WT   | 10    | 9      |
| WL   | 16    | 13     |
| SP   | 11    | 9      |
| DF   | 11    | 9      |

Talon's deliberately average slasher who made AD anyway — no elite stat,
nothing starved, scimitar-capable at creation. The article's lesson: you do
not need a perfect design, only adequate stats, a good blade, and the right
rhythm.

## Striker

**Doctrine:** Pure offensive — the striker wins on the first blow or not at all; never a tank, rarely a dodger. Design for endurance and damage first (Normal/Normal or better), then attack, initiative, and decisiveness — decise around 8+, attack 6+. Stat minimums by consensus: strength 9, wit 11, will 9, deftness 11; constitution and size are flexible, speed situational. Weapons by need: shortsword, hatchet, or quickstrike for speed; scimitar, broadsword, or battle axe for damage; longsword all-around. ALE or lighter armor — a striker in plate has already lost. Every tactic appears on a canon sheet: decisiveness is the signature, responsiveness answers enemy strikers, and bash, slash, lunge, dodge, even none all have their place. The classic run is 10-10-x — wind him up, let him go, throttle down once the first blow lands. Hunts bashers, slashers, parry-lungers, and aimed blows; fears parry-ripostes and walls that weather the first blow.

### Offense Hunter

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 10    | 8      |
| SZ   | 6    | 5      |
| WT   | 19    | 16      |
| WL   | 13    | 11      |
| SP   | 11    | 9      |
| DF   | 15    | 12      |

A sub-style against the trend — hunts other offensive styles rather than high-constitution targets. Deftness backs the attack rating with great wit behind it; speed helps decisiveness and initiative. Modest damage, but most offensives carry little constitution anyway.

*Tactics:* Decisiveness; responsiveness can frustrate opposing strikers and bashers.

### Classic Striker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13      |
| CN   | 5    | 4      |
| SZ   | 9    | 7      |
| WT   | 17    | 14      |
| WL   | 15    | 13      |
| SP   | 7    | 6      |
| DF   | 15    | 13      |

The traditional striker — uses the style's decise advantage and a good wit to stay ahead of other styles. Deftness adds attack because the first shot has to count with low constitution. Strength is high for great damage and nearly any weapon. Endurance is the weak point: he has to end it quick.

*Tactics:* Decisiveness only.

### Low-Will Wonder

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14      |
| CN   | 9    | 8      |
| SZ   | 7    | 6      |
| WT   | 17    | 14      |
| WL   | 9    | 7      |
| SP   | 14    | 12      |
| DF   | 11    | 9      |

This low will wonder needs help to reach normal endurance — hence the high strength, which has the bonus of guaranteeing good damage on a relatively small warrior. The 11 deftness opens suitability to almost every weapon.

*Tactics:* Decisiveness only.

### Assur's Godling

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 21    | 18      |
| CN   | 4    | 3      |
| SZ   | 7    | 6      |
| WT   | 21    | 18      |
| WL   | 9    | 7      |
| SP   | 11    | 9      |
| DF   | 11    | 9      |

Assur's maxed godling — twenty-one strength and wit with everything else at minimums. Brilliant on paper, but four constitution means the first minute is the whole fight; Assur offers him as the cautionary entry.

*Tactics:* Decisiveness — the bout must end before the flaws do.

### Assur's Giant

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 9    | 8      |
| SZ   | 16    | 13      |
| WT   | 21    | 17      |
| WL   | 10    | 8      |
| SP   | 8    | 7      |
| DF   | 11    | 9      |

The big striker — sixteen size supplies the hit points that nine constitution and ten will cannot, freeing wit for twenty-one. Slow, but a giant can afford to be.

*Tactics:* Decisiveness; bash if the decise fails to land.

### Assur's Stayer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 3    | 3      |
| SZ   | 16    | 13      |
| WT   | 17    | 14      |
| WL   | 17    | 14      |
| SP   | 9    | 7      |
| DF   | 13    | 11      |

Assur's endurance experiment — three constitution behind a sixteen-size hit-point pool and seventeen will. Staying power bought with size and will instead of constitution.

*Tactics:* Decisiveness — and he can actually outlast the counter.

### Assur's Hammer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14      |
| CN   | 5    | 4      |
| SZ   | 10    | 9      |
| WT   | 21    | 18      |
| WL   | 10    | 8      |
| SP   | 10    | 8      |
| DF   | 11    | 9      |

Seventeen strength does the talking — great damage on demand with twenty-one wit to learn the rest. Five constitution is the usual striker tax.

*Tactics:* Decisiveness; bash against the soft matchups.

### Assur's Sprinter

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 13    | 11      |
| SZ   | 5    | 4      |
| WT   | 21    | 18      |
| WL   | 9    | 7      |
| SP   | 14    | 12      |
| DF   | 11    | 9      |

The speed build — fourteen speed on a five-size frame presses the decisiveness edge to its limit. Thirteen constitution is a luxury few strikers get.

*Tactics:* Decisiveness — first strike is the whole game plan.

### Assur's Cutter

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13      |
| CN   | 3    | 3      |
| SZ   | 11    | 9      |
| WT   | 21    | 17      |
| WL   | 9    | 7      |
| SP   | 14    | 12      |
| DF   | 11    | 9      |

Fifteen strength and fourteen speed — Assur's scimitar striker, built to put a damaging blow in flight before anyone answers.

*Tactics:* Decisiveness; slash situationally.

### Assur's Duelist

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14      |
| CN   | 4    | 3      |
| SZ   | 10    | 8      |
| WT   | 21    | 18      |
| WL   | 9    | 8      |
| SP   | 10    | 8      |
| DF   | 13    | 11      |

Seventeen strength with a thirteen-deft hand — the duelist variant, built to hit hard and hit where aimed.

*Tactics:* Decisiveness; riposte when the opponent overcommits.

### Assur's Scholar

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 9    | 8      |
| SZ   | 12    | 10      |
| WT   | 21    | 17      |
| WL   | 10    | 8      |
| SP   | 12    | 10      |
| DF   | 11    | 9      |

The balanced twenty-one-wit build — no stat starved below nine, nothing wasted. Assur's safest striker: learns everything, lacks only a signature.

*Tactics:* Any offensive tactic the matchup calls for; decisiveness by default.

### Brainy Striker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 12    | 10      |
| SZ   | 10    | 8      |
| WT   | 19    | 16      |
| WL   | 9    | 8      |
| SP   | 6    | 5      |
| DF   | 17    | 14      |

Blind Man's thesis build — nineteen wit does the learning that nine will cannot, and seventeen deftness makes the first blow count. His argument: will is the stat a striker can starve.

*Tactics:* Decisiveness opener; responsiveness against opposing offensives.

### Glass Decider

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 12    | 10      |
| SZ   | 12    | 10      |
| WT   | 19    | 16      |
| WL   | 7    | 6      |
| SP   | 4    | 3      |
| DF   | 21    | 17      |

The extreme version — twenty-one deftness decides bouts in a single exchange while four speed and seven will leave him glass. Blind Man's proof one maxed stat can carry a striker.

*Tactics:* Decisiveness — win before the flaws show.

### Sir Boyd's Perfect

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11      |
| CN   | 4    | 3      |
| SZ   | 9    | 8      |
| WT   | 21    | 18      |
| WL   | 11    | 9      |
| SP   | 9    | 7      |
| DF   | 17    | 14      |

Sir Boyd's ideal — clears every stated minimum with maxed wit and near-maxed deftness. ST+SZ is 22, past his durability bar of 21.

*Tactics:* Decisiveness; responsiveness against enemy strikers.

### Sir Boyd's Swift

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 4    | 3      |
| SZ   | 11    | 9      |
| WT   | 17    | 14      |
| WL   | 11    | 9      |
| SP   | 15    | 13      |
| DF   | 15    | 13      |

Boyd's speed variant — fifteen speed sharpens the decise edge, and ST+SZ still reaches his 21-point bar.

*Tactics:* Decisiveness; responsiveness against enemy strikers.

### Fool's Biff

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 9      |
| CN   | 10    | 8      |
| SZ   | 11    | 9      |
| WT   | 4    | 3      |
| WL   | 17    | 14      |
| SP   | 17    | 14      |
| DF   | 15    | 13      |

Talon's wit-starved biff — four wit, seventeen speed and will. Deliberately jank: the style forgives a bad stat line when the first blow lands.

*Tactics:* None — a biff runs naked.

### Clever Biff

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 7    | 6      |
| CN   | 11    | 9      |
| SZ   | 17    | 14      |
| WT   | 17    | 14      |
| WL   | 11    | 9      |
| SP   | 6    | 5      |
| DF   | 15    | 13      |

The clever biff — seventeen wit and a seventeen-size frame carry seven strength; six speed is the price of admission.

*Tactics:* None, or dodge when the first exchange goes wrong.

### Gambler's Biff

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 5    | 4      |
| SZ   | 14    | 12      |
| WT   | 17    | 14      |
| WL   | 11    | 9      |
| SP   | 13    | 11      |
| DF   | 15    | 12      |

The gambler — five constitution behind a fourteen-size frame, betting the bout ends before endurance does.

*Tactics:* None — bet it all on the opening.

### Hulk Biff

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 4    | 3      |
| CN   | 8    | 7      |
| SZ   | 17    | 14      |
| WT   | 15    | 13      |
| WL   | 13    | 11      |
| SP   | 10    | 8      |
| DF   | 17    | 14      |

The hulk — four strength on a seventeen-size frame with seventeen deftness. Hits like a feather, cannot be dropped: Talon's most perverse workable biff.

*Tactics:* None — survive to the counter-punch.

### Godling Biff

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 21    | 18      |
| CN   | 3    | 3      |
| SZ   | 15    | 12      |
| WT   | 21    | 17      |
| WL   | 5    | 4      |
| SP   | 8    | 7      |
| DF   | 11    | 9      |

Two twenty-ones and three dump stats — Talon's godling experiment. Magnificent in minute one, nothing left after.

*Tactics:* Decisiveness — there is no plan B.

### Talon's Solid

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11      |
| CN   | 6    | 5      |
| SZ   | 9    | 8      |
| WT   | 17    | 14      |
| WL   | 17    | 14      |
| SP   | 9    | 7      |
| DF   | 13    | 11      |

Talon's solid citizen — no gimmick, just seventeen wit and will over adequate everything. The build he actually recommends.

*Tactics:* Decisiveness in minute one; responsiveness if a defensive tactic is wanted.

### Primal Perfect

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13      |
| CN   | 3    | 3      |
| SZ   | 5    | 4      |
| WT   | 21    | 17      |
| WL   | 15    | 12      |
| SP   | 8    | 7      |
| DF   | 17    | 14      |

Talon's perfect column — twenty-one wit, fifteen will and strength, near-maxed deftness on a five-size frame. The dream roll-up.

*Tactics:* Decisiveness; responsiveness against enemy decise.

### Tex's Workhorse

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11      |
| CN   | 5    | 4      |
| SZ   | 17    | 14      |
| WT   | 17    | 14      |
| WL   | 10    | 8      |
| SP   | 9    | 8      |
| DF   | 13    | 11      |

Tex's 69-fight veteran — a seventeen-size, seventeen-wit workhorse that simply outlasted everyone. Proof durability and learning beat elegance over a career.

*Tactics:* Decisiveness; slash or bash by the matchup.

### Tex's Graduate

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 9    | 8      |
| CN   | 9    | 8      |
| SZ   | 11    | 9      |
| WT   | 17    | 14      |
| WL   | 11    | 9      |
| SP   | 10    | 8      |
| DF   | 17    | 14      |

The graduate — modest stats maximally deployed; seventeen wit and deftness carried him clean through to graduation.

*Tactics:* Decisiveness; any defensive tactic but parry.

### Tex's Bruiser

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14      |
| CN   | 6    | 5      |
| SZ   | 11    | 9      |
| WT   | 17    | 14      |
| WL   | 9    | 8      |
| SP   | 11    | 9      |
| DF   | 13    | 11      |

Seventeen strength does the talking — a wit-seventeen bruiser who hits hard and learns whatever else he needs.

*Tactics:* Decisiveness; bash against bashers.

### Tex's Godling

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 13    | 11      |
| SZ   | 11    | 9      |
| WT   | 21    | 18      |
| WL   | 9    | 7      |
| SP   | 6    | 5      |
| DF   | 13    | 11      |

Tex's godling — twenty-one wit headlining a balanced frame with no true weakness. The safe godling.

*Tactics:* Decisiveness; responsiveness against enemy strikers.

### Tex's Fireball

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 17    | 14      |
| CN   | 8    | 7      |
| SZ   | 7    | 6      |
| WT   | 17    | 14      |
| WL   | 5    | 4      |
| SP   | 13    | 11      |
| DF   | 17    | 14      |

Five will with seventeen strength, speed, and deftness — burns spectacularly and briefly. Tex's cautionary fireball.

*Tactics:* Decisiveness only — the flame does not last.

### Tex's Stayer

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 10    | 8      |
| CN   | 10    | 8      |
| SZ   | 10    | 8      |
| WT   | 21    | 18      |
| WL   | 14    | 12      |
| SP   | 11    | 9      |
| DF   | 8    | 7      |

Twenty-one wit and fourteen will — Tex's stayer wins long fights he has no business surviving.

*Tactics:* Any tactic the book allows; he has the wit to use them all.

### Tex's Accident

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 12    | 10      |
| CN   | 15    | 13      |
| SZ   | 4    | 3      |
| WT   | 18    | 15      |
| WL   | 21    | 18      |
| SP   | 4    | 3      |
| DF   | 10    | 8      |

The accident — a roll meant for another style: eighteen wit, twenty-one will, four speed and four size. Graduated anyway; the article's strangest success.

*Tactics:* None — let the skills do the work.

### Tex's Grinder

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 12    | 10      |
| CN   | 12    | 10      |
| SZ   | 7    | 6      |
| WT   | 20    | 17      |
| WL   | 14    | 12      |
| SP   | 9    | 7      |
| DF   | 10    | 8      |

Twenty wit over a grinder's frame — nothing fancy: outlasts and out-learns.

*Tactics:* Decisiveness early; whatever the second minute demands.

### Crimson Striker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11      |
| CN   | 5    | 4      |
| SZ   | 10    | 9      |
| WT   | 17    | 14      |
| WL   | 11    | 9      |
| SP   | 10    | 9      |
| DF   | 17    | 14      |

The Crimson Strategist's synthesized ideal — clears every stated minimum (strength 9, wit 11, will 9, deftness 11) with seventeen wit and deftness; five constitution says pure offensive.

*Tactics:* Decisiveness or responsiveness — the answer depends on the opponent's tempo.


## Total-Parry

**Doctrine:** Entirely defense — attacks only as an afterthought once defense
is assured. Best at parry but able to use all defensive tactics;
effectiveness depends on strategy and opponent. Offensive tactics lower the
defense — use with care.

### The Ghost

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 5     | 4      |
| CN   | 10    | 8      |
| SZ   | 3     | 3      |
| WT   | 19    | 16     |
| WL   | 15    | 12     |
| SP   | 13    | 11     |
| DF   | 19    | 16     |

An extreme build: insane parry, tiny size, good speed — near impossible to
hit. Carries only his weapon; damage is negligible and that's fine. High
deftness and speed feed a solid riposte. A more exciting version of scum,
still long-term capable.

## Wall of Steel

**Doctrine:** The all-around style — good defense with equal offense, rarely
fast. Parries until it gains the initiative, then strikes powerfully.
Defensively parry and some riposte; offensively bash and slash, depending on
the weapon.

### Aegis

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 10    | 8      |
| SZ   | 7     | 6      |
| WT   | 19    | 16     |
| WL   | 15    | 13     |
| SP   | 5     | 4      |
| DF   | 17    | 14     |

Defensive version heavy on parry. Wit secures an incredible parry, attack,
and initiative base. Fight like an aimed-blow: low KD, low/mod AL, moderate
OE.

### Bruiser

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 13    | 11     |
| CN   | 16    | 13     |
| SZ   | 9     | 8      |
| WT   | 15    | 12     |
| WL   | 17    | 14     |
| SP   | 3     | 3      |
| DF   | 11    | 9      |

Offensive version — strength develops over time, speed eventually must rise
to avoid clumsiness. High constitution absorbs nearly anything and sustains
full offense indefinitely; wears any armor without trouble.

---

*Source: Duel2 Arena 93 Newsletters — Noblish Island compilation, "Long Term
Fighter Concepts," Gavin Rule, mgr Faux Tides (1482), DM 93.*
