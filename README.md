# Stable Lords

**Stable Lords** is a tactical gladiator-management game inspired by the classic play-by-mail game _Duelmasters / Duel II_. You own a stable of warriors — recruit them, train their attributes and fighting styles, equip them, and send them into the arena. Combat is **simulated, not twitch-based**: you plan tactics and loadouts, then watch a deep exchange-by-exchange engine resolve the fight using canonical Duel II skill tables, hit locations, fatigue, fighting-style matchups, weather, aging, and permadeath.

> This is a management/strategy game. Success comes from matching warriors to the right style, scouting opponents, managing a fragile economy, and surviving the deaths.

## Core loop

Each week: review your roster and finances → assign training → equip warriors → accept or decline bout offers → advance the week → the simulation resolves every bout, ticks the economy, applies training, and publishes the Gazette.

## Features

- **Deep combat simulation** — 10 fighting styles, tactics, weapon suitability, hit locations, fatigue, psychological states, weather, and a per-exchange resolution engine.
- **Post-fight & pre-fight analysis** — see _why_ a bout went the way it did, and a predicted-edge forecast before you commit.
- **Living world** — rival stables with their own AI strategists, promoters, crowd moods, meta drift, tournaments, a Hall of Fame, and a graveyard.
- **Stable management** — recruiting, trainers, equipment, a scaling fame/tier economy, aging, and injuries.

## Tech stack

- [Bun](https://bun.sh/) (package manager + runtime)
- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TanStack Router](https://tanstack.com/router) (file-based routing)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand) (state) · [Vitest](https://vitest.dev/) (tests) · [Electron](https://www.electronjs.org/) (desktop build)

## Getting started

Requires [Bun](https://bun.sh/).

```sh
bun install          # install dependencies
bun run dev          # web version → http://localhost:8080
bun run electron:dev # desktop (Electron) version
```

## Development

```sh
bun run test         # run the test suite (Vitest)
bun run type-check   # TypeScript type-check
bun run lint         # ESLint
bun run e2e          # Playwright end-to-end tests
```

The player-facing manual lives in [`Docs/USER_MANUAL.md`](Docs/USER_MANUAL.md); design docs are in [`Docs/`](Docs/).
