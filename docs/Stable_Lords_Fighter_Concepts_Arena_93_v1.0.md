# Stable Lords — Long-Term Fighter Concepts (Arena 93)

Canonical per-style fighter builds, adapted from the Duel2 Arena 93 newsletter
article **"Long Term Fighter Concepts"** by Gavin Rule, mgr Faux Tides (1482).

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

**Doctrine:** Like the lunger but favors parry over dodge and defense first.
Offensively still the lunge; defensively parry and responsiveness, riposte
okay, dodge passable.

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

Small size aids defense; damage is the weak point. Learns quickly — after
stat trains toward 15s he becomes a serious competitor. Needs a careful
challenge strategy until then.

## Parry-Riposte

**Doctrine:** Superior riposte steals the initiative and strikes while the
foe is off balance. Well suited to lunge, less so slash, terribly to bash and
decisiveness. Defensively riposte and parry; dodge and responsiveness poorly.

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

## Parry-Striker

**Doctrine:** Quick fighters who assure defense first, attack second. Like
strikers — fast and powerful — but conserve endurance better than expected.
Decisiveness well suited; parry and responsiveness defensively, riposte
workable. Holds ground — dodge is poor.

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

## Slasher

**Doctrine:** Can penetrate parry with superior attack when deftness is high.
Needs consistency and few mistakes. Very offensive — suited to the slash
tactic only.

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

## Striker

**Doctrine:** Fast and decisive — designed around decisiveness to land the
first shot. Decisiveness is the only suited offensive tactic; responsiveness
if anything defensively.

### Offense Hunter

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 11    | 9      |
| CN   | 10    | 8      |
| SZ   | 6     | 5      |
| WT   | 19    | 16     |
| WL   | 13    | 11     |
| SP   | 11    | 9      |
| DF   | 15    | 12     |

A sub-style against the trend — hunts other offensives rather than high-con
targets. Deftness backs the attack rating; speed helps decisiveness and
initiative. Modest damage, but most offensives carry little constitution.

### Classic Striker

| Stat | Canon | Scaled |
| ---- | ----- | ------ |
| ST   | 15    | 13     |
| CN   | 5     | 4      |
| SZ   | 9     | 7      |
| WT   | 17    | 14     |
| WL   | 15    | 13     |
| SP   | 7     | 6      |
| DF   | 15    | 13     |

Traditional striker: decise advantage plus good wit. Deftness adds attack —
the first shot has to count with low constitution. High strength for great
damage and nearly any weapon. Endurance is the fallback: end it quick.

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
