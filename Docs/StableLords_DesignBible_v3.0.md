# 🏛️ STABLE LORDS — DESIGN BIBLE v3.0  
### “Blood and Legacy” Edition

---

## TABLE OF CONTENTS

1. World & Calendar Overview  
2. Combat Systems (Summary)  
3. Trainer Systems  
4. Offseason & Yearly Cycle  
5. World Chronicle & Gazette Systems  
6. Procedural Writing System  
7. Procedural Naming System  
8. Leaderboards & Prestige Framework  
9. Arena & Stable Hall Interfaces  
10. Fame, Crowd Sentiment, and Popularity Systems  

---

# 9️⃣ ARENA & STABLE HALL INTERFACES

## 9.1 Arena Hub UI

The **Arena Hub** serves as the player’s main window into the active competitive world.

### Layout Overview
| Region | Purpose |
|---------|----------|
| **Central Banner** | Current Arena Name, region emblem, and crowd “mood meter.” |
| **Left Panel** | Weekly Arena Leaderboard (Top 10 Warriors). |
| **Right Panel** | “Spotlight Feed” – narrative highlights (duels, kills, rivalries). |
| **Bottom Bar** | Tabs: *Leaderboards • Match Results • Gazette • Meta Pulse.* |
| **Background Visuals** | Procedural crowd animation — changes by bloodlust, fame, or tournament season. |

---

### Arena Leaderboard Display
```
╔════════════════════════════════════════════════╗
║  ARENA RANKINGS — WEEK 34, YEAR 12             ║
╠════════════════════════════════════════════════╣
║ # | WARRIOR               | STYLE | W-L-K | FAME ║
║ 1 | Drogan Ironjaw        | BA    | 12-2-5 | 98↑  ║
║ 2 | Avel Tyros            | PS    | 10-4-0 | 85   ║
║ 3 | Serenne Vail          | PR    | 9-3-1  | 79↓  ║
╚════════════════════════════════════════════════╝
```

---

### Crowd Mood Display
A dynamic radial meter showing **Arena Temperament**.

| Icon | Mood | Description |
|-------|------|--------------|
| 🕊️ | Calm | Defensive play, technical appreciation |
| ⚔️ | Bloodthirsty | Demands aggression and kills |
| 🎭 | Theatrical | Favors dramatic, close fights |
| 🕯️ | Solemn | Post-death or tragedy phase |
| 💰 | Festive | Tournament hype, crowd chants louder |

---

## 9.2 Stable Hall UI

Each **Stable** has its own *Hall of Records*, a hybrid dashboard and prestige page.

### Layout Overview
| Section | Content |
|----------|----------|
| **Hall Banner** | Stable emblem + motto (“By Steel and Shadow”). |
| **Roster Wall** | 10 warrior cards, sortable by record, fame, or style. |
| **Trainer Table** | Trainers listed with specialization and contract year. |
| **Stable Reputation Bar** | Fame, Notoriety, Honor, Adaptability (4 sliders). |
| **Leaderboards** | Local stable rank, tournament points, crowd appeal rank. |
| **Stable Chronicle Feed** | Excerpts from Chronicle & Gazette related to this stable. |

---

### Stable Reputation Metrics

| Attribute | Description | Source |
|------------|--------------|--------|
| **Fame** | Public acclaim, boosted by wins and showmanship | Duels, Gazette mentions |
| **Notoriety** | Feared reputation, from kills and rivalries | Deaths, Injuries, Finishers |
| **Honor** | Moral standing (crowd respect) | Yielding, mercy, fair play |
| **Adaptability** | Strategic responsiveness to meta | Meta Drift participation, Style switching |

---

## 9.3 Trainer Market Interface

Displayed during offseason and mid-year breaks.

**Tabs:** *Available Trainers*, *Stable Contracts*, *Top Mentors of the Season*, *Departed Legends*

Each Trainer card shows:
- Portrait  
- Specialty (Aggression, Defense, Endurance, etc.)  
- Former stable affiliation  
- Contract length (1 year minimum)  
- Bonus Modifiers (numerical and descriptive)  
- Popularity (Famed, Trusted, Controversial, Unknown)

---

## 9.4 Hall of Fighters

Permanent archive of annual award winners and retired legends.  
Interactive “Pantheon” grid, sortable by: Year Inducted, Style, Stable, Kill Count, Championships.

---

# 🔟 FAME, CROWD SENTIMENT, AND POPULARITY SYSTEMS

Fame = W*Wins + K*Kills + D*DramaticMoments + C*CrowdApproval + G*GazetteMentions - P*PoorPerformances

- 0–100 scale. Decays slowly if inactive.  
- Stable Fame = average of top 5 warriors’ fame, modified by reputation.

### Notoriety System
```
Notoriety = BaseKills*2 + FatalFinishers*3 + RivalKills*5 + DishonorableActs*2
```

---

# 📊 SYSTEM INTEGRATION

| System | Output | Feeds Into |
|---------|---------|------------|
| Combat Engine | Battle logs, kills, finishers | Fame + Crowd Sentiment |
| Leaderboard Service | Weekly and seasonal scores | Gazette, Recap, Halls |
| Gazette Service | Narrative synthesis | Fame/Notoriety modifiers |
| Chronicle | Permanent record | Hall of Fighters, Meta Drift |
| Trainer Ledger | Market generation | Trainer Rankings, Recaps |
| Naming Service | Cultural + stylistic identity | Gazette, Stable & Warrior Cards |

---

# 🏟️ PRESENTATION NOTES

UI inspired by illuminated manuscripts and carved marble halls.  
Leaderboards appear as engraved tablets that shimmer when fame changes.

---

### **Outcome of v3.0**
Stable Lords now operates as a living ecosystem of fame, history, and legacy.
