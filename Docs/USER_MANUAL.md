# Stable Lords — Player's Manual

> *Manage your stable of warriors, train fighting styles, and compete in the arena!*
> Version 2.1.0

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [The Game Loop](#3-the-game-loop)
4. [Warriors](#4-warriors)
   - 4.1 [Attributes](#41-attributes)
   - 4.2 [Base Skills](#42-base-skills)
   - 4.3 [Fighting Styles](#43-fighting-styles)
   - 4.4 [Aging & Career Arc](#44-aging--career-arc)
5. [Equipment](#5-equipment)
   - 5.1 [Weapons](#51-weapons)
   - 5.2 [Armor & Helms](#52-armor--helms)
   - 5.3 [Shields](#53-shields)
6. [Training](#6-training)
   - 6.1 [Training Modes](#61-training-modes)
   - 6.2 [Trainers](#62-trainers)
   - 6.3 [Injuries During Training](#63-injuries-during-training)
7. [Recruitment](#7-recruitment)
8. [Economy](#8-economy)
   - 8.1 [Income](#81-income)
   - 8.2 [Expenses](#82-expenses)
   - 8.3 [Managing Your Treasury](#83-managing-your-treasury)
9. [Combat](#9-combat)
   - 9.1 [How a Bout Works](#91-how-a-bout-works)
   - 9.2 [Exchange Resolution](#92-exchange-resolution)
   - 9.3 [Damage & Hit Locations](#93-damage--hit-locations)
   - 9.4 [Death & Permadeath](#94-death--permadeath)
10. [Matchmaking & Bookings](#10-matchmaking--bookings)
11. [Injuries](#11-injuries)
12. [Tournaments](#12-tournaments)
13. [Scouting & Rivals](#13-scouting--rivals)
14. [The World](#14-the-world)
    - 14.1 [Crowd Mood](#141-crowd-mood)
    - 14.2 [Weather](#142-weather)
    - 14.3 [Meta Drift](#143-meta-drift)
15. [The Gazette](#15-the-gazette)
16. [The Graveyard & Hall of Fame](#16-the-graveyard--hall-of-fame)
17. [Dashboard & UI Overview](#17-dashboard--ui-overview)
18. [Save & Load](#18-save--load)
19. [Glossary](#19-glossary)

---

## 1. Introduction

**Stable Lords** is a tactical management game set in a brutal arena world. You are the owner and strategist of a fighting *stable* — a roster of warriors you recruit, train, equip, and send into the arena to earn fame and fortune.

The game is inspired by **Duelmasters**, a classic play-by-mail strategy game, and uses its canonical combat tables, skill breakpoints, and fighting style system.

**This is not a twitch game.** No direct action is performed in combat. You plan, prepare, and commit — then watch your warriors fight according to their training and your strategic direction.

Success requires:
- Picking warriors with the right attributes for their chosen style
- Matching them to appropriate fights
- Building a financially viable stable over many weeks
- Surviving the inevitable deaths and setbacks along the way

---

## 2. Getting Started

### Running the App

```bash
# Install dependencies (first time only)
bun install

# Start the web version
bun run dev
# Open http://localhost:8080 in your browser

# OR start the desktop (Electron) version
bun run electron:dev
```

### First Launch

On first launch you will be walked through the **First-Time Experience (FTUE)**:

1. **Choose a backstory** for your stable's owner — this is flavour, but some backstories grant small starting bonuses to gold, recruits, or trainer quality.
2. **Name your stable** and **design your heraldic crest** (shield shape, field pattern, colours, charges).
3. **Receive your starting roster** — three warriors are generated for you based on your backstory.
4. **Begin Week 1.**

---

## 3. The Game Loop

Stable Lords operates in **weekly turns**. Each week consists of:

```
┌─────────────────────────────────────────────────────┐
│  PLANNING PHASE (you control this)                  │
│   • Review your roster, finances, injuries          │
│   • Assign training to warriors                     │
│   • Equip warriors for upcoming bouts               │
│   • Accept or decline bout offers from promoters   │
│   • Hire/fire trainers, recruit new warriors        │
│   • Scout rival stables                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  SIMULATION PHASE (automated)                       │
│   • All accepted bouts are fought                   │
│   • Economy ticks (income − expenses)               │
│   • Training results applied                        │
│   • World events resolved (rivals, meta drift)      │
│   • Gazette published                               │
└─────────────────────────────────────────────────────┘
```

There are **52 weeks per in-game year**. At year-end, annual awards are given, warriors age by one year, and a seasonal growth summary is shown.

---

## 4. Warriors

Warriors are the heart of your stable. Each has a set of **attributes**, derived **skills**, a **fighting style**, an **equipment loadout**, and a career history.

### 4.1 Attributes

Seven core attributes govern everything about a warrior. They range from **3** (minimum) to **25** (theoretical maximum). Starting warriors are typically in the 7–15 range.

| Attribute | Abbrev. | Primary Effect |
|-----------|---------|----------------|
| Strength | ST | Damage dealt; contributes to Attack skill |
| Constitution | CN | Hit Points; Endurance pool |
| Size | SZ | HP; modifies Initiative, Parry, Defense |
| Wit | WT | Initiative bonus (spike at 11+); Feinting |
| Will | WL | Morale; resisting injury fatigue |
| Speed | SP | Movement; Defense contribution |
| Deftness | DF | Riposte; Initiative; precision |

> **Tip:** Size is the only attribute that *cannot* be trained — warriors are born with it and it never changes.

**Hit Points** = SZ + (CN × 1.5), capped at 30.

**Endurance** = CN × 1.25.

### 4.2 Base Skills

Six combat skills are *derived* from attributes using the canonical Duelmasters breakpoint table. They range from **1** to **20**.

| Skill | Abbrev. | Description |
|-------|---------|-------------|
| Attack | ATT | Likelihood of landing a hit |
| Parry | PAR | Active block effectiveness |
| Defense | DEF | Passive evasion |
| Initiative | INI | Who acts first in an exchange |
| Riposte | RIP | Counter-attack after a successful parry |
| Decisiveness | DEC | Aggression; willingness to press attacks |

Skills are not trained directly like attributes. They improve when the underlying attributes improve — or through **skill drilling** (see Training). Each attribute contributes to multiple skills via breakpoint bonuses:

- Higher **ST** → better **ATT**
- Higher **DF** → better **RIP** and **INI**
- Higher **WT** → large **INI** bonus (especially at WT ≥ 11)
- Higher **SP** → better **DEF**
- **SZ** modifies **INI**, **PAR**, and **DEF** (large fighters are slower to react; small fighters are harder to hit)

### 4.3 Fighting Styles

Every warrior fights in one of **10 fighting styles**, each with distinct strengths, weaknesses, and playstyles. A style grants passive bonuses and imposes penalties — choose based on the warrior's attribute spread.

| Style | Abbrev. | Playstyle Summary |
|-------|---------|-------------------|
| Aimed Blow | AB | Precision striker; rewards high DF and WT |
| Bashing Attack | BA | Brute force; rewards high ST and SZ |
| Lunging Attack | LA | Aggressive reach; rewards ST and SP |
| Parry-Lunge | PL | Bait and punish; balanced offence/defence |
| Parry-Riposte | PR | Counter-fighting; rewards high DF and RIP |
| Parry-Strike | PS | Methodical; rewards CN and PAR |
| Slashing Attack | SA | Fast multi-hit; rewards SP and DF |
| Striking Attack | StA | Hard hits with reach; rewards ST and WT |
| Total Parry | TP | Pure defence; survives anything; low offence |
| Wall of Steel | WS | Offence and defence simultaneously; rewards all-round stats |

**Style matchups matter.** Some styles are inherently advantaged against others. Studying the meta — and scouting your opponents — lets you exploit these relationships.

### 4.4 Aging & Career Arc

Warriors age **one year every 52 weeks**. Attribute *decay* begins at **age 30**:
- Each year after 30, one random attribute loses 1 point.
- Decay accelerates slightly with each additional year.

A warrior's productive career is typically **5–10 in-game years** before decay outpaces gains. Plan retirements before decay cripples them.

Warriors can end their career three ways:
- **Retirement** — you choose to retire them (preserves their legacy)
- **Death** — killed in the arena (permanent)
- **Career-ending injury** — a permanent injury forces retirement

---

## 5. Equipment

Equipment affects combat directly. A warrior fights every bout with the gear you assign during the planning phase.

### 5.1 Weapons

Every weapon has a **weight class** (Light → Heavy) and **attribute requirements**. Using a weapon you lack the strength for incurs penalties.

| Category | Examples | Notes |
|----------|----------|-------|
| Light blades | Dagger, Short Sword | Fast, low damage; suits AB and PR |
| Medium blades | Longsword, Epée | Balanced; good all-round |
| Heavy blades | Greatsword, Falchion | Two-handed; high damage; suits BA and LA |
| Spears | Shortspear, Longspear | Reach advantage; suits LA |
| Axes | Hand Axe, Battle Axe | High damage vs. heavy armour |
| Hammers / Clubs | Mace, Warhammer | Blunt; high trauma vs. lightly armoured |

Each style has **preferred weapon types** (bonus) and **restricted types** (penalty or forbidden). Match weapon to style for best results.

### 5.2 Armor & Helms

Armor reduces incoming damage but adds **encumbrance**, which drains **endurance** faster and penalises **speed-based skills**.

| Armor | Protection | Encumbrance |
|-------|-----------|-------------|
| None | 0 | 0 |
| Leather | Low | Minimal |
| Chain Mail | Medium | Moderate |
| Plate | High | Heavy |

| Helm | Protection | Encumbrance |
|------|-----------|-------------|
| None | 0 | 0 |
| Leather Cap | Minimal | None |
| Steel Cap | Low | Minimal |
| Helm | Medium | Low |
| Full Helm | High | Moderate |

> **Tip:** Total Parry fighters can afford heavy armour — they don't rely on speed. Slashing Attack fighters should stay light.

### 5.3 Shields

Shields provide a coverage zone (LOW, MEDIUM, or HIGH body area protection).

| Shield | Coverage | Encumbrance |
|--------|----------|-------------|
| Small Shield | One zone | Minimal |
| Medium Shield | Two zones | Low |
| Large Shield | All zones | Moderate |

Shields cannot be used with two-handed weapons. They primarily benefit Parry-based styles.

---

## 6. Training

Each week, every warrior can be assigned to **one training mode**. Training costs **20 gold per warrior per week** regardless of mode.

### 6.1 Training Modes

| Mode | Effect | Risk |
|------|--------|------|
| **Attribute Training** | Chance to gain +1 in a chosen attribute (capped by potential) | ~20% injury chance |
| **Skill Drilling** | +1 to a chosen combat skill (capped by drill limit) | Slightly lower injury risk |
| **Recovery** | Reduces weeks remaining on an injury | No new injury risk |

**Attribute potential** is hidden — each attribute has a personal ceiling beyond which no further gains are possible. The ceiling is revealed gradually through training attempts.

**Skill drill cap** limits how many times you can artificially boost any one skill through drilling (typically 5–7 total across a career). Use drills wisely.

### 6.2 Trainers

Trainers improve the effectiveness and safety of training. Each trainer has a **tier** and optionally a **specialty**.

| Tier | Weekly Salary | Effect |
|------|--------------|--------|
| Novice | 10 gold | Baseline |
| Seasoned | 25 gold | +1 to gain chance; -1 injury severity |
| Master | 75 gold | +2 to gain chance; -2 injury severity; specialty bonus |

**Specialties** (Master trainers only):
- **Healing** — reduces injury recovery time
- **Attribute** (specific stat) — bonus gain chance for that attribute
- **Skill** (specific skill) — bonus effectiveness for skill drilling

Trainers are hired from the **Trainers** page and apply their bonuses to all warriors they supervise.

### 6.3 Injuries During Training

Training is dangerous. Each week of attribute training carries roughly a **20% chance of a minor injury**. Severity is modified by trainer tier.

If a warrior is injured in training, they may be automatically switched to **Recovery** mode, or you can manually reassign them.

---

## 7. Recruitment

Your stable needs fresh blood. New warriors are recruited from the **Recruit** page.

### Recruit Pool

Each week, **12 recruits** are available. The pool refreshes automatically each week, or you can pay **50 gold** to reroll it immediately.

### Recruit Tiers

| Tier | Cost | What you get |
|------|------|--------------|
| Common | 50g | Random attributes; usually unremarkable |
| Promising | 150g | At least one strong attribute; some style fit |
| Exceptional | 300g | Strong attribute spread; good style alignment |
| Prodigy | 500g | Elite starting stats; rare |

Each recruit's **attribute total**, **attribute distribution**, and **recommended style** are visible before purchase. Buy based on style fit, not raw totals — a warrior with the right spread for their style will always outperform a mismatched "big numbers" warrior.

---

## 8. Economy

Gold is the lifeblood of your stable. Running out means you can't train, can't recruit quality fighters, and may lose trainers.

### 8.1 Income

| Source | Amount |
|--------|--------|
| Fight purse (per bout) | 240 gold |
| Win bonus (per victory) | 100 gold |
| Fame dividend (per week) | Fame × 0.5 gold |
| Noble patronage | (Fame − 40) ÷ 10 × 25 gold per famous warrior |

Patronage only activates when a warrior's fame exceeds **40**. It scales significantly as warriors become arena legends.

### 8.2 Expenses

| Source | Amount |
|--------|--------|
| Warrior upkeep | 60g base + 1.5g × warrior's fame (per warrior, per week) |
| Novice trainer salary | 10g/week |
| Seasoned trainer salary | 25g/week |
| Master trainer salary | 75g/week |
| Training fee | 20g per warrior in training |
| Recruit purchase | 50–500g (one-time) |
| Scout report | 25g per rival |
| Recruit pool reroll | 50g |

> **Watch out:** Famous warriors are expensive to keep. A warrior with 30 fame costs 105g/week just in upkeep — before training. Multiple high-fame fighters can drain your treasury unless they're earning patronage.

### 8.3 Managing Your Treasury

The **Ledger** (accessible from the Dashboard) shows a full breakdown of every transaction, week by week. Use it to:
- Identify which warriors are net-positive vs. net-negative
- Project next week's balance before committing to training
- Spot trends (is your stable growing or shrinking financially?)

**If your treasury goes negative:**
- Trainer contracts may lapse automatically
- Warriors incur morale penalties
- You cannot recruit until solvent

---

## 9. Combat

Combat is fully automated. You set strategy; your warriors execute it.

### 9.1 How a Bout Works

A bout consists of a series of **exchanges** — each representing roughly 6–8 seconds of fighting. Bouts typically last **8–12 exchanges**, though some end faster (knockout) or drag on longer (endurance battles).

Combat has three **phases**:
- **Opening** (exchanges 1–3): Distance established, tempo set
- **Mid** (exchanges 4–7): Primary exchange phase; most damage dealt
- **Late** (exchanges 8+): Fatigue becomes a factor; kills more likely

Before a bout begins, you assign each warrior a **fight plan**:
- **Offensive Emphasis** (1–10): How aggressively to attack
- **Defensive Emphasis** (1–10): How actively to defend (dodge vs. parry vs. riposte)
- **Responsiveness**: Whether to adapt tactics mid-fight

### 9.2 Exchange Resolution

Each exchange resolves in sequence:

1. **Initiative roll** — Both fighters roll d20 + INI modifier. Winner acts first.
2. **Attack roll** — Attacker rolls d20 + ATT vs. Defender's DEF.
3. **Defense response** — Defender attempts dodge, parry, or riposte (based on their plan).
4. **Riposte** — If the defender parried successfully, they may immediately counter-attack (RIP check).
5. **Damage** — Hits deal weapon base damage + strength modifier, reduced by armour.
6. **Endurance drain** — Both fighters lose endurance (more in armour; more when attacking hard).
7. **Fatigue check** — Exhausted fighters become vulnerable.

### 9.3 Damage & Hit Locations

Every hit strikes a **specific body location**:

| Location | Consequences |
|----------|-------------|
| Head | High damage; potential stun; helm matters |
| Chest | High damage; reduces endurance regeneration |
| Abdomen | Moderate damage; injury-prone |
| Arms | Moderate damage; may penalise attack or parry |
| Legs | Moderate damage; penalises speed and defence |

Armour coverage varies by body area — full plate covers the chest; lighter armours leave extremities exposed.

### 9.4 Death & Permadeath

Death is real and permanent. When a warrior's **HP drops below 30%** AND **endurance drops below 20%**, a **kill window** opens. The opponent (if aggressive) may attempt a finishing blow.

Factors that affect kill probability:
- **Crowd mood** — a bloodthirsty crowd raises kill odds slightly
- **Opponent's offensive emphasis** — aggressive opponents press kill opportunities
- **Warrior's Will** — high WL reduces the chance of succumbing to finishing blows
- **Injuries** — active injuries make death more likely

When a warrior dies:
- Their record is preserved in the **Graveyard**
- Their fame contributes to your stable's historical legacy
- A **death narrative** is generated describing their final moments
- All equipment is recovered (not lost)

> **There is no resurrection.** Manage fight frequency and match difficulty for your most valuable warriors accordingly.

---

## 10. Matchmaking & Bookings

Warriors don't fight unless you book them. Each week, **promoters** offer bouts through the **Booking Office**.

### Promoters

Each promoter has a **personality** that shapes the fights they offer:

| Personality | Tendency |
|-------------|----------|
| Greedy | High purses; dangerous opponents |
| Honorable | Fair matchmaking; reliable payouts |
| Sadistic | Underdog matchups; crowd-pleasing deaths |
| Flashy | Spectacle-first; theatrical settings |
| Corporate | Consistent, low-risk, low-reward |

### Bout Offers

Each offer includes:
- **Opponent** (name, style, record)
- **Purse** amount
- **Arena** (with conditions)
- **Expiry** — offers lapse if not accepted before the week's simulation

Accept offers by confirming them in the Booking Office. Warriors can fight **once per week**. Overworking warriors risks injury accumulation.

### Rivalry Matches

Some bouts are marked as **rivalry** matches — grudge fights with personal stakes. These tend to involve higher purses, elevated kill probability, and special narrative outcomes. Rivalries develop organically through repeated matchups with specific opponents.

---

## 11. Injuries

Injuries occur in combat and (less commonly) during training. They are tracked per warrior with a severity and a recovery duration.

### Injury Severities

| Severity | Recovery | Example Penalties |
|----------|----------|-------------------|
| Minor | 1–2 weeks | -1 to one skill |
| Moderate | 2–4 weeks | -1 ST or SP; -1 skill |
| Severe | 4–8 weeks | -2 to multiple stats; can't fight |
| Critical | 8–16 weeks | Major attribute loss; fight risk elevated |
| Permanent | Never | Attribute permanently reduced; may force retirement |

### Managing Injuries

- Assign injured warriors to **Recovery** training mode — this actively reduces recovery time.
- A **Master trainer with Healing specialty** cuts recovery time further.
- Warriors with **Critical** injuries who continue fighting risk death.
- **Permanent injuries** reduce an attribute forever. Multiple permanent injuries stack and may require retirement.

---

## 12. Tournaments

Seasonal tournaments offer prestige, glory, and prize money beyond regular bouts.

### Tournament Types

- **Seasonal Grand Melee** — all-comers bracket tournament
- **Divisional Championships** — tiered by ranking
- **Invitational Bouts** — promoter-curated prestige events

### Awards

At year end, **annual medallions** are awarded based on performance:
- **Gold Medallion** — best record in division
- **Silver Medallion** — second place
- **Bronze Medallion** — notable achievement

Medallion counts contribute to a warrior's legacy and the **Hall of Fame** rankings.

### Promotion & Relegation

Warriors rise through competitive divisions as their record improves. Higher divisions mean harder opponents — but also larger purses and more fame.

---

## 13. Scouting & Rivals

Information is power. The **Scouting** system lets you spend **25 gold per report** to learn about a rival stable's warriors.

A scout report reveals:
- Warrior attributes (partial)
- Fighting style
- Win/loss record
- Active injuries
- Recent equipment loadout

Use this to:
- Identify dangerous opponents to avoid
- Find weak opponents to farm wins and fame
- Prepare counter-strategies (style matchup + equipment adjustment)

### Rival Stables

Eight AI-controlled rival stables compete in the same world. Each has a distinct personality:

| Personality | Strategy |
|-------------|----------|
| Aggressive | All-out offence; high win/death rate |
| Methodical | Patient, attribute-focused development |
| Showman | Fame-maximising; theatrical fights |
| Pragmatic | Economy-focused; avoids unnecessary risk |
| Tactician | Style counter-picking; scout-heavy |

Rivals remember outcomes. Beat a rival's star warrior, and they may challenge yours to a revenge match.

---

## 14. The World

### 14.1 Crowd Mood

Each week the arena crowd has a **mood** that subtly affects combat:

| Mood | Effect |
|------|--------|
| Calm | Neutral; no modifier |
| Bloodthirsty | Kill probability +0.4–0.8% |
| Theatrical | Flamboyant attacks preferred; ripostes rewarded |
| Solemn | Subdued; opponents fight more defensively |
| Festive | Fights resolved faster; less lethal |

### 14.2 Weather

Weather affects combat mechanics:

| Weather | Effect |
|---------|--------|
| Clear | No modifier |
| Rain | Footing penalty (−1 DEF, −1 ATT) |
| Snow | Footing and visibility penalty |
| Fog | INI penalty; surprise attacks more effective |
| Blood Moon | Rare; elevated kill probability and damage |

Weather is displayed before you confirm bout acceptance — factor it in for critical fights.

### 14.3 Meta Drift

The fighting-style **meta** evolves weekly. As certain styles win more, rival stables adopt them. As a style becomes common, counter-styles become viable.

The **Gazette** tracks meta trends. Staying ahead of the meta — or deliberately counter-picking it — is a legitimate long-term strategy.

---

## 15. The Gazette

The **Gazette** is your in-world weekly newspaper. It reports:
- Notable bout outcomes (upsets, deaths, legendary performances)
- Leaderboard standings
- Rival stable news and rumours
- Meta drift commentary
- Economic news (patron activity, prize pool changes)

Reading the Gazette regularly is essential for tracking the competitive landscape without spending scout gold.

---

## 16. The Graveyard & Hall of Fame

### Graveyard

Fallen warriors are permanently remembered in the **Graveyard**. Each entry shows:
- Career record (wins/losses/kills)
- Cause of death
- Death narrative
- Final fame score
- Equipment at time of death

The Graveyard is not just memorial — it's a record of your stable's history and the battles that shaped it.

### Hall of Fame

The **Hall of Fame** honours the greatest warriors ever to fight in the arena. Entry requires a combination of:
- High win totals
- Championship titles
- Tournament medallions
- Exceptional fame score

Your stable's Hall of Fame entries contribute to long-term legacy and prestige.

---

## 17. Dashboard & UI Overview

The **Dashboard** is your command centre. It consists of **18+ modular widgets** that can be rearranged to suit your playstyle.

### Core Widgets

| Widget | Purpose |
|--------|---------|
| Roster Overview | Quick stats on all warriors (HP, injuries, assigned training) |
| Treasury Snapshot | Current gold, projected next-week balance |
| Weekly Schedule | Accepted bouts for the coming week |
| Gazette Headlines | Latest news at a glance |
| Training Summary | Which warriors are training what |
| Bout Offers | Pending promoter offers (with expiry countdown) |
| Fame Leaderboard | Your warriors' fame vs. the world |
| Injury Report | Active injuries and recovery timelines |
| Tournament Bubble | Your warriors' position relative to promotion/relegation |
| Meta Overview | Current style popularity and trend direction |

Widgets can be **dragged and reordered**. Focus your dashboard on what matters most at your current stage of the game.

### Other Pages

| Page | Purpose |
|------|---------|
| Control Center | Game settings, cheat tools, simulation speed |
| Stable Equipment | Manage and bulk-assign gear to warriors |
| Trainers | Hire, fire, and review trainer contracts |
| Graveyard | Memorial for fallen warriors |
| Hall of Fame | All-time records |
| Help | In-game documentation |

---

## 18. Save & Load

Stable Lords saves automatically after each weekly simulation. You do not need to manually save.

**Save slots** allow multiple simultaneous playthroughs. Access save management from the **Control Center** or the main menu.

Data is stored locally in your browser (IndexedDB) or, in the desktop version, in a native app data folder via Electron Store. Clearing browser data will delete web saves — the desktop version is recommended for long campaigns.

---

## 19. Glossary

| Term | Definition |
|------|-----------|
| **Attribute** | A core warrior stat (ST, CN, SZ, WT, WL, SP, DF) |
| **Base Skill** | A derived combat skill (ATT, PAR, DEF, INI, RIP, DEC) |
| **Bout** | A single scheduled fight between two warriors |
| **Breakpoint** | An attribute value threshold that triggers a skill bonus |
| **DEC** | Decisiveness — how aggressively a warrior presses advantages |
| **Endurance** | Stamina pool; depletes during combat; exhaustion → vulnerability |
| **Exchange** | One ~6-second unit of combat; bouts consist of many exchanges |
| **Fame** | A warrior's renown; affects income, expenses, and legacy |
| **Fight Plan** | Your pre-bout tactical instructions to a warrior |
| **FTUE** | First-Time User Experience — the new game setup flow |
| **HP** | Hit Points; a warrior's capacity to absorb damage |
| **Kill Window** | State where HP < 30% and Endurance < 20%; death is possible |
| **Lineage** | A warrior's heritage and generation depth |
| **Meta** | The current dominant fighting style trends in the arena world |
| **Patronage** | Gold income from noble sponsors attracted to famous warriors |
| **Permadeath** | Permanent, irreversible death — there is no resurrection |
| **Potential** | A hidden per-attribute growth ceiling for each warrior |
| **Purse** | Gold paid for participating in a bout |
| **Riposte** | A counter-attack executed after successfully parrying |
| **Stable** | Your collection of warriors, trainers, and equipment |
| **Style** | A fighting discipline (e.g., Parry-Riposte, Bashing Attack) |
| **Trainer** | A hired specialist who improves training outcomes |
| **Treasury** | Your stable's current gold balance |
| **Upkeep** | The weekly gold cost of maintaining a warrior in your roster |

---

*Stable Lords — version 2.1.0*
