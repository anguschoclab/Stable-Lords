# 🏇 Stable Lords – Complete Design Bible (v1.6.0)
*Reordered for clarity and production workflow*  
*Updated: 2025-10-27*

---

## 1. Core Design Overview
Stable Lords is a management-simulation strategy game set in a gritty fantasy world of gladiatorial combat. Players and AI manage warrior stables, training, and evolving through seasons of tournaments, fame, and meta shifts.

---

## 2. Game Structure & Progression
- The game operates on a **calendar year**, divided into four **tournament seasons**: Spring, Summer, Fall, and Winter.  
- Each season includes weekly matches, culminating in a major tournament.  
- Offseason is a shorter phase for recruitment, trainer contracts, and recovery.

---

## 3. Warrior Lifecycle
- Warriors are generated procedurally from the **Orphanage System**, representing young aspirants entering the arena.  
- Warriors can be created manually or drafted by the player.  
- Death is determined by **hit location**, **damage thresholds**, and **finishing blows**, with Gazette entries chronicling notable deaths.  
- Warriors accumulate fame, popularity, rivalries, and titles such as *Rookie of the Year*, *Killer of the Year*, and *Fighter of the Year*.

---

## 4. Training & Trainers
Trainers provide bonuses and personality-driven coaching.  
Each has a **specialty** (Endurance, Aggression, Defense, Mind, or Healing) that enhances associated stats or traits.  
Retired warriors entering the trainer pool retain bonuses from their former fighting styles.  
Trainer contracts last **one in-game year** and are managed in the offseason.

---

## 5. Stables & Stable Owners
Each stable:
- Can field **10 warriors**, plus one per champion held.  
- Can hire up to **5 trainers**, choosing from the available pool.  
- Develops personality and style bias over time (e.g., aggressive, defensive, experimental).  
- AI stables dynamically adjust to meta trends or resist them, depending on owner temperament.

---

## 6. Tournament System
Tournaments occur each season with multiple tiers (Regional, Invitational, and Masters).  
Rewards for winners are tiered as follows:

| Place | Reward |
|--------|---------|
| 🥇 1st | Adds +1 permanent warrior slot to the stable. |
| 🥈 2nd | Grants a **Weapon Insight Token** (reveals or boosts favorite weapon). |
| 🥉 3rd | Grants a **Rhythm Insight Token** (reveals or boosts OE/AL). |

Rewards stack per season and per tier but must be used before year-end.

---

## 7. Reward Selection & Transfer System
If a warrior already knows their favorite weapon or rhythm:
- The stable gains an **Insight Token** instead.
- Tokens may be **assigned to another warrior** during the Post-Tournament Phase.
- Flavor text and Gazette entries narrate these mentorship events.

Tokens expire at year-end but can stack within the stable (max 4 per type).

---

## 8. Stable Ledger UI/UX Specification
The **Stable Ledger** is a comprehensive management screen combining reward tracking, trainer contracts, and historical records.

### Tabs
1. **Overview** – Stable snapshot.
2. **Rewards & Insights** – Manage Weapon and Rhythm Insight tokens.
3. **Contracts & Tenure** – Track trainer contracts, morale, and expiry.
4. **Chronicle Log** – Historical performance records.
5. **Hall of Warriors** – Retired or fallen fighters with summaries.

### Rewards Grid
Displays token icon, source tournament, type, status, expiry, and available actions.  
Includes an “Assign →” modal with warrior list and detailed stats.  
Narrative flavor appears after token assignment.

### Year-End Recap
Shows:
- Tokens earned, spent, and expired.  
- Notes on mentorship or missed opportunities.  
- Gazette integration for narrative continuity.

### Data Hooks
```json
{
  "stable": "Iron Gale",
  "tokens": {
    "weapon": [ {"source": "Autumn Invitational", "expires": "Year 23"} ],
    "rhythm": [ {"source": "Summer Regional", "expires": "Year 23"} ]
  }
}
```

---

## 9. Warrior, Stable, Trainer, and Owner Cards
### Shared Design Principles
All cards are interactive, dynamically linked, and show contextual tournament information, fame, and relationships.

| Card Type | Displays |
|------------|-----------|
| **Warrior Card** | Stats, traits, physicals, favorite weapon, fight history, kills, awards, tournaments won, rivalries, and fame. |
| **Trainer Card** | Specialty bonus, experience, notable trainees, and current contract duration. |
| **Stable Card** | Active warriors, trainer roster, reputation, champion lineage, and current standings. |
| **Owner Card** | Personality archetype, leadership style, and influence over AI behavior. |

Each card deep-links into related profiles (e.g., clicking on a tournament name brings up results and standings).

---

## 10. Meta Drift System
Meta shifts occur organically based on the evolving world — styles rise and fall as wins, losses, and deaths reshape public perception.  
AI personalities adapt dynamically, while Gazette reports the changing trends in tone and narrative (“The Age of Shields,” “Era of Blood,” etc.).

---

## 11. Procedural Systems
- **Procedural Writing:** Gazette articles, death vignettes, and recaps generated using Ink and AI-tagged templates.  
- **Procedural Naming:** Unique names for all entities (warriors, trainers, stables, arenas). Names reflect cultural and class tendencies (e.g., defensive stables use stoic Latin names, aggressive ones Norse or Celtic).  
- Each entity has a **unique backend ID** for reference consistency.

---

## 12. Annual Cycle & Offseason
- Each year has four tournaments and inter-season fighting periods.  
- Offseason allows for trainer contracts, token usage, and orphanage recruitment.  
- **World Chronicle** and **Seasonal Recap** include:  
  - Hall of Fame entries.  
  - Fighter of the Year, Rookie of the Year, Killer of the Year.  
  - Style leaders per fighting style.  
  - Gazette newsletter with dynamic crowd commentary and fame reactions.

---

## 13. Orphanage & FTUE (First-Time User Experience)
- Players start at the **Warrior Orphanage**, where new warriors are procedurally generated.  
- The player can adopt or draft warriors from this pool or create their own.  
- The FTUE tutorial introduces game systems through early matches, training, and management.  
- AI stables draw recruits from the same orphanage pool, maintaining world balance.

---

## 14. Leaderboards & Fame Systems
Leaderboards exist at global, style-specific, and tournament levels.  
Crowd popularity and fame modify Gazette coverage and ticket sales (narratively).  
Fame, popularity, and crowd reaction also influence awards and invitations to higher-tier tournaments.

---

## 15. Data Schema Overview
Each major entity type (Warrior, Trainer, Stable, Owner) has:
- Unique UUID.  
- Linked relationships (e.g., `warrior.trainer`, `stable.owner`).  
- Chronicle entries for history reconstruction.

---

## 16. Appendix
- Fonts: Saira SemiCondensed, DM Mono.  
- Theme: Snowdrop visual style (teal/black/white).  
- UI Library: Radix + Tailwind + React.  
- Core Engine: TypeScript (logic) + Python (procedural generation).

---
