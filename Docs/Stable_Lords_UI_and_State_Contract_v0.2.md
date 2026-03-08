# Stable Lords — UI & State Contract (Extracted + Target Map) v0.2

> Generated: 2026-01-10

This document is a **UI engineering contract**: it enumerates the *actual* current UI surfaces discovered in the provided StableLords build archives, then expands them into the **required target navigation map** implied by the Design Bibles + Feature Integration Matrix.

It is meant to be used as:
- a route map
- a per-screen acceptance criteria checklist
- a component + state ownership reference

---

## 1) Build Reality Check: What Exists in the Provided Code

### 1.1 App entry + routing

The current build uses a Next-style entry (`src/app/page.tsx`) that renders an internal `AppRoot`, which itself uses `react-router-dom` with a small route table.

**Observed router definition (verbatim):**

```ts
import React from 'react';
import { createBrowserRouter, RouterProvider, RouteObject, Link } from 'react-router-dom';
import HallOfFights from '../pages/HallOfFights';
import { ToastsProvider } from '../ui/Toasts';
import RunRoundPanel from '../components/RunRoundPanel';

const routes: RouteObject[] = [
  { path: '/', element: <RunRoundPanel /> },
  { path: '/hall-of-fights', element: <HallOfFights /> },
];

const router = createBrowserRouter(routes);

export default function AppRoot() {
  return (
    <ToastsProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link to="/" className="hover:text-emerald-300">Run Round</Link>
              <Link to="/hall-of-fights" className="hover:text-emerald-300">Hall of Fights</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">
          <RouterProvider router={router} />
        </main>
      </div>
    </ToastsProvider>
  );
}
```

**Interpretation:**
- Currently *wired* routes:
  - `/` → Run Round (RunRoundPanel)
  - `/hall-of-fights` → Hall of Fights
- There are additional route components present in `src/routes/*`, but they are not currently registered in `AppRoot`.


### 1.2 UI feature inventory (files discovered)

This is the inventory of UI/state modules that exist in the provided build and are intended to be wired:

```text
app/AppRoot.tsx
app/layout.tsx
app/page.tsx
components/Badges/PersonalityBadge.tsx
components/CharacterPage.tsx
components/Chips/FameChip.tsx
components/Chips/RenownChip.tsx
components/Owners/HallOfOwnersPage.tsx
components/PlanBuilder.tsx
components/ResultChips.tsx
components/RosterTable.tsx
components/RunRoundPanel.tsx
components/TargetingModal.tsx
components/Toasts.tsx
lore/AnnouncerAI.ts
lore/HallOfFights.tsx
lore/LoreArchive.ts
metrics/StyleMeter.ts
modules/owners.ts
modules/trainers.ts
panels/NewsletterPanel.tsx
panels/RunRoundPanel.tsx
routes/CharacterPage.tsx
routes/owners/index.tsx
state/gameStore.ts
state/save.owners.ts
state/save.patches.ts
state/uiPrefs.ts
ui/Chips.tsx
ui/Toasts.tsx
ui/TournamentLegacy.tsx
ui/TournamentPanel.tsx
ui/commentator.ts
ui/fightVariety.ts
ui/flair/FlairChips.tsx
ui/toast/Toasts.tsx
```

### 1.3 State stores and persistence helpers

#### 1.3.1 Zustand store (current)

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type Warrior = {
  id: string
  name: string
  style: string
  stats: Record<string, number>
}

type GameState = {
  warriors: Warrior[]
  addWarrior: (w: Warrior) => void
}

export const useGameStore = create<GameState>()(immer((set) => ({
  warriors: [],
  addWarrior: (w) => set((s) => {
    s.warriors.push(w)
  })
})))
```

**Contract implications:**
- `useGameStore.warriors[]` is the canonical in-memory roster list for now.
- Any screen that edits roster must funnel edits through a store method (currently only `addWarrior`).
- For future-proofing, expand to include:
  - stables
  - trainers
  - tournaments
  - chronicle entries
  - gazette issues
  - meta weights
  - saves


#### 1.3.2 Owners persistence helpers (present)

```ts
/**
 * Persistence helpers for Owners — pairs with global save.ts store.
 * These helpers are safe to include even if save.ts stores owners differently;
 * they no-op gracefully when arrays aren't present.
 */

export type OwnerPersist = {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
};

const KEY = 'dm.owners.v1';

export function loadOwners(): OwnerPersist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOwners(list: OwnerPersist[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function upsertOwner(owner: OwnerPersist) {
  const list = loadOwners();
  const idx = list.findIndex(o => o.id === owner.id);
  if (idx >= 0) list[idx] = owner; else list.push(owner);
  saveOwners(list);
}

export function bumpOwnerFame(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.fame = Math.max(0, (o.fame || 0) + amt); saveOwners(list); }
}

export function bumpOwnerRenown(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.renown = Math.max(0, (o.renown || 0) + amt); saveOwners(list); }
}

export function addOwnerTitle(id: string) {
  const list = loadOwners();
  const o = list.find(x => x.id === id);
  if (o) { o.titles = (o.titles || 0) + 1; saveOwners(list); }
}
```

**Contract implications:**
- Owners have a stable name, fame, renown, titles, personality.
- These helpers imply local persistence (storage key not shown due to truncated excerpt).
- Hall of Owners can be implemented without the full simulation: seed owners, rank them, render chips.


#### 1.3.3 UI prefs persistence (present)

```ts
export type UIPrefs = { autoTunePlan: boolean };
const K = 'dm.uiprefs.v1';
export function loadUIPrefs(): UIPrefs {
  try { const raw = localStorage.getItem(K); if (raw) return JSON.parse(raw); } catch {}
  return { autoTunePlan: true };
}
export function saveUIPrefs(p: UIPrefs) {
  try { localStorage.setItem(K, JSON.stringify(p)); } catch {}
}
```

---

## 2) Screens Present (Implemented or Near-Implemented)

This section defines each screen with:
- route
- purpose
- primary UI regions
- state/data dependencies
- interactions
- acceptance criteria


### 2.1 Run Round (Home)

**Route (wired):** `/`

**Purpose:**
- Run a weekly simulation step (“Run Round / Run Week”) and display outputs.
- Acts as the ‘dev harness’ for simulation, newsletter, and style meter.

**Primary components referenced:**
- `components/RunRoundPanel.tsx`
- `panels/NewsletterPanel.tsx`
- `lore/StyleMeter` and `metrics/StyleMeter`
- `engine/simWrapper`, `engine/matchmaking`

**State/Data:**
- Local component state: `running`, `results[]`
- LoreArchive acts as historical cache for fights and hall labels.

**Interactions:**
- User presses Run Round
- App generates weekly matchups
- Sim runs fights
- Results appended to archive and surfaced in UI

**Acceptance criteria:**
- Run button is disabled during run.
- Run produces deterministic results when seed is fixed.
- Results list includes: winner, method, at least 1 “variety/flashy” tag.
- Errors are toast surfaced; app never hard-crashes.


### 2.2 Hall of Fights

**Route (wired):** `/hall-of-fights`

**Purpose:**
- Archive viewer of notable fights; intended to show weekly highlights and tournament hall entries.

**Primary module (verbatim excerpt):**

```ts
/* Duelmasters — Sprint 5A delta */
import React from "react";
import { LoreArchive } from "./LoreArchive";

const Row: React.FC<{ title: string; right?: string; children?: React.ReactNode }> = ({ title, right, children }) => (
  <div className="rounded border border-gray-200 p-3 bg-white shadow-sm">
    <div className="flex items-center justify-between">
      <div className="font-semibold">{title}</div>
      {right && <div className="text-xs text-gray-500">{right}</div>}
    </div>
    {children}
  </div>
);

export const HallOfFights: React.FC = () => {
  const hall = LoreArchive.allHall().slice().reverse();
  const fights = new Map(LoreArchive.allFights().map(f => [f.id, f]));
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hall of Fights</h1>
      <p className="text-sm text-gray-600 mb-6">Crowd-remembered epics of the arena.</p>
      <div className="space-y-3">
        {hall.map(h => {
          const f = fights.get(h.fightId);
          if (!f) return null;
          const title = f.title || `${f.a} vs. ${f.d}`;
          const by = f.by ? ` (${f.by})` : "";
          return (
            <Row key={h.fightId} title={`${h.label} — Week ${h.week}`} right={new Date(f.createdAt).toLocaleString()}>
              <div className="mt-1 text-sm">{title}{by}</div>
              {f.flashyTags && f.flashyTags.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.flashyTags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{t}</span>)}
                </div>
              )}
            </Row>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFights;
```

**State/Data:**
- Reads from `LoreArchive.allHall()`
- Reverse chronological display

**Interactions:**
- Scroll and browse
- (Target) click to open fight detail view (future)

**Acceptance criteria:**
- Never empty in demo mode: Seed Demo must create hall entries.
- Each row shows: title, right-side meta label (week/season/tournament), summary, tags.
- Clicking a tag filters view (target enhancement).


### 2.3 Hall of Owners (Present, Not Wired)

**Route (target):** `/owners`

**Purpose:**
- Ranks owners by an aggregate score derived from Fame/Renown/Titles and personality.

**Primary component (verbatim excerpt):**

```ts
import * as React from 'react';
import { loadOwners } from '../../state/save.owners';
import { rankOwners } from '../../modules/owners';
import { FameChip } from '../Chips/FameChip';
import { RenownChip } from '../Chips/RenownChip';
import { PersonalityBadge } from '../Badges/PersonalityBadge';

export default function HallOfOwnersPage() {
  const [owners, setOwners] = React.useState(loadOwners());
  React.useEffect(() => {
    setOwners(loadOwners());
  }, []);

  const ranks = rankOwners(owners);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Hall of Owners</h1>
      <p className="text-sm text-zinc-400">Ranking owners by Fame, Renown, and Titles.</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70">
            <tr>
              <th className="text-left px-3 py-2">Rank</th>
              <th className="text-left px-3 py-2">Owner</th>
              <th className="text-left px-3 py-2">Stable</th>
              <th className="text-left px-3 py-2">Badges</th>
              <th className="text-left px-3 py-2">Fame</th>
              <th className="text-left px-3 py-2">Renown</th>
              <th className="text-left px-3 py-2">Titles</th>
              <th className="text-left px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map(r => {
              const o = owners.find(x => x.id === r.id)!;
              return (
                <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 font-medium">{r.rank}</td>
                  <td className="px-3 py-2">{o.name}</td>
                  <td className="px-3 py-2">{o.stableName}</td>
                  <td className="px-3 py-2"><PersonalityBadge personality={o.personality} /></td>
                  <td className="px-3 py-2"><FameChip value={o.fame || 0} /></td>
                  <td className="px-3 py-2"><RenownChip value={o.renown || 0} /></td>
                  <td className="px-3 py-2">{o.titles || 0}</td>
                  <td className="px-3 py-2">{Math.round(r.score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**State/Data:**
- `loadOwners()` from `state/save.owners`
- `rankOwners()` from `modules/owners`

**Interactions:**
- Sort and filter owners (target)
- Click owner → open Stable Hall (target)

**Acceptance criteria (to wire):**
- Add nav link in AppRoot
- Register route `{ path: '/owners', element: <OwnersRoute/> }`
- Ensure Seed Demo generates at least 10 owners.


### 2.4 Character Page (Present, Not Wired)

**Route (target):** `/warrior/:id`

**Purpose:**
- Detailed warrior profile: record, fame, popularity, injuries, titles, trainer status.

**Route component excerpt:**

```ts
import * as React from "react";
import { FlairChip } from "../components/ResultChips";

type Injury = { name: string; week: number };
type Title = { name: string; season: string };

export type CharacterRecord = {
  id: string;
  name: string;
  stableId: string;
  style: string;
  fame: number;
  popularity: number;
  wins: number; losses: number; kills: number;
  injuries?: Injury[];
  titles?: Title[];
  trainerStatus?: { isTrainer: boolean; specialty?: string } | null;
  flair?: string|null;
};

export const CharacterPage: React.FC<{ char: CharacterRecord }> = ({ char }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{char.name}</h1>
          <p className="text-sm text-slate-400">{char.style} • {char.wins}-{char.losses}-{char.kills} • Fame {char.fame} • Pop {char.popularity}</p>
        </div>
        <FlairChip flair={char.flair} />
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Career Stats</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>Wins: {char.wins}</li>
            <li>Losses: {char.losses}</li>
            <li>Kills: {char.kills}</li>
            <li>Fame: {char.fame}</li>
            <li>Popularity: {char.popularity}</li>
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Injury History</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.injuries?.length ? char.injuries : []).map((i,idx)=>(<li key={idx}>{i.name} (Week {i.week})</li>))}
            {!(char.injuries?.length) && <li>None</li>}
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Titles</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.titles?.length ? char.titles : []).map((t,idx)=>(<li key={idx}>{t.name} — {t.season}</li>))}
            {!(char.titles?.length) && <li>None yet</li>}
          </ul>
        </div>
      </section>

      {char.trainerStatus?.isTrainer && (
        <section className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Trainer</h2>
          <p className="text-sm text-slate-300">Specialty: {char.trainerStatus?.specialty || "Generalist"}</p>
        </section>
      )}
    </div>
  );
};
```

**State/Data:**
- Needs character lookup by id (store or LoreArchive)

**Interactions:**
- from roster table, click name → navigate to profile

**Acceptance criteria:**
- Route param id loads from a canonical store (Zustand + persistence)
- If missing id, show “Unknown warrior” with back link; never crash.


---

## 3) Target Navigation Map (Required by Design Bibles + Feature Matrix)

This is the **intended** navigation structure once the design-doc-defined screens are implemented. Each item includes a recommended route and the source-of-truth owning module.


### 3.1 Top-level routes

- `/` Arena Hub (world dashboard)

- `/stable` Stable Hall (your stable prestige page)

- `/ledger` Stable Ledger (management super-screen)

- `/tournaments` Tournament Index

- `/tournaments/:id` Tournament Bracket + Prep Mode

- `/owners` Hall of Owners

- `/warrior/:id` Warrior Card / Profile

- `/trainer/:id` Trainer Card

- `/archives/styles` Style Archives Browser

- `/archives/styles/:styleId` Style Detail

- `/gazette` Gazette Index

- `/gazette/:issueId` Gazette Issue Detail

- `/chronicle` Chronicle Browser

- `/settings` Settings + Accessibility

- `/mods` Mods / House Rules

- `/import-export` Import/Export Manager

- `/telemetry` Telemetry + Error Logs

- `/admin` Admin Tools (dev builds)


### 3.2 Required deep links (must work anywhere)

- From any warrior name chip → `/warrior/:id`
- From any stable name chip → `/stable/:id` (future; player stable default `/stable`)
- From any tournament reference → `/tournaments/:id`
- From any Chronicle entry → opens a detail drawer with linked entities


---

## 4) Per-Screen UI Contracts (Granular)

This section is the engineering checklist that ensures each screen is shippable and aligns to the master design.


### 4.1 Arena Hub (`/`)

**UI regions (required):**
1. Header banner: arena name, emblem, season/week, crowd mood meter
2. Left rail: weekly Top 10 leaderboard
3. Right rail: Spotlight feed (kills, rivalries, upsets)
4. Bottom tabs:
   - Leaderboards
   - Match Results
   - Gazette
   - Meta Pulse

**State dependencies:**
- `worldClock` (year/season/week)
- `crowdMood`
- `leaderboard[]`
- `spotlightFeed[]`
- `metaWeights` (style effectiveness)
- `latestResults[]`

**Interactions:**
- Run Week / Simulate
- Click leaderboard entry → warrior profile
- Click feed item → fight detail / chronicle entry

**Acceptance criteria:**
- Arena Hub must render even with empty state (demo scaffolding).
- All list items are clickable and do not dead-end.
- Mood meter updates after fights.


### 4.2 Stable Hall (`/stable`)

**UI regions:**
- Banner (emblem + motto)
- Roster wall (cards) with sorting: record/fame/style
- Trainer table (specialty + contract year)
- Reputation sliders (fame/notoriety/honor/adaptability)
- Stable leaderboards (rank, titles)
- Chronicle excerpt feed (stable-related events)

**State:**
- stable record, roster ids, trainer ids
- aggregated metrics

**Acceptance criteria:**
- Roster cards deep link to warrior profiles.
- Reputation sliders reflect computed values and show tooltip explanation.


### 4.3 Stable Ledger (`/ledger`)

**Tabs (required):** Overview, Rewards & Insights, Contracts & Tenure, Chronicle Log, Hall of Warriors.

**Rewards & Insights:**
- token inventory table
- assign token modal
- expiry warning banners

**Acceptance criteria:**
- Tokens cannot be assigned illegally.
- Token assignment produces a Chronicle entry + Gazette hook.


### 4.4 Tournament Index + Tournament Detail (`/tournaments`)

**Tournament Index:** list upcoming/current/past tournaments, with tier chips.
**Tournament Detail:** bracket, entrants, results, reward summary.

**Prep Mode (Feature 23):**
- eligibility checklist
- fatigue/injury warnings
- equipment freeze checks
- ‘Fix now’ shortcuts

**Acceptance criteria:**
- Bracket is navigable round-by-round.
- Prep Mode has blocking vs non-blocking issues clearly labeled.


### 4.5 Style Archives (`/archives/styles`)

**Purpose:** encyclopedia for the 10 styles.

**Acceptance criteria:**
- Search + filter
- Link from style chip anywhere


### 4.6 Settings + Accessibility (`/settings`)

- High contrast
- Text size
- Reduced motion
- Persist prefs


---

## 5) Wiring Plan: Minimal Route Additions to Reach the Target Map

To turn the existing build into the required navigable shell (always playable):

1. Expand `routes` in `AppRoot.tsx` to include placeholder pages for all top-level routes.
2. Add nav links for: Arena Hub, Stable Hall, Ledger, Tournaments, Owners, Archives, Settings.
3. Seed Demo must populate:
   - 1 player stable + 9 AI stables
   - 50+ warriors
   - 10 owners
   - at least 1 Gazette issue and 10 Chronicle entries
4. Every placeholder route must show meaningful demo content and a “Coming soon” section.

