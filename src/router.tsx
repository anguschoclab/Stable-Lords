import React from "react";
import { RootRoute, Route, Router, Outlet, createMemoryHistory, createBrowserHistory } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
// ─── Lazy Loaded Pages ──────────────────────────────────────────────────────
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const RunRound = React.lazy(() => import("@/pages/RunRound"));
const Tournaments = React.lazy(() => import("@/pages/Tournaments"));
const Help = React.lazy(() => import("@/pages/Help"));
const WarriorDetail = React.lazy(() => import("@/pages/WarriorDetail"));
const HallOfFights = React.lazy(() => import("@/lore/HallOfFights"));
const Recruit = React.lazy(() => import("@/pages/Recruit"));
const Graveyard = React.lazy(() => import("@/pages/Graveyard"));
const Training = React.lazy(() => import("@/pages/Training"));
const Trainers = React.lazy(() => import("@/pages/Trainers"));
const Scouting = React.lazy(() => import("@/pages/Scouting"));
const StableDetail = React.lazy(() => import("@/pages/StableDetail"));
const WorldOverview = React.lazy(() => import("@/pages/WorldOverview"));
const Gazette = React.lazy(() => import("@/pages/Gazette"));
const HallOfFame = React.lazy(() => import("@/pages/HallOfFame"));
const KillAnalytics = React.lazy(() => import("@/pages/KillAnalytics"));
const EquipmentOptimizerPage = React.lazy(() => import("@/pages/EquipmentOptimizerPage"));
const TrainingPlanner = React.lazy(() => import("@/pages/TrainingPlanner"));
const SeasonalAwards = React.lazy(() => import("@/pages/SeasonalAwards"));
const TournamentAwards = React.lazy(() => import("@/pages/TournamentAwards"));
const StableLedger = React.lazy(() => import("@/pages/StableLedger"));
const StableHall = React.lazy(() => import("@/pages/StableHall"));
const BookingOffice = React.lazy(() => import("@/pages/BookingOffice"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Orphanage = React.lazy(() => import("@/pages/Orphanage"));

// ─── Route Components ───────────────────────────────────────────────────────

function Root() {
  return (
    <AppShell>
      <React.Suspense fallback={<div className="h-screen w-screen bg-[#0d0f14] flex flex-col items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-primary/80 animate-pulse">
        <div className="mb-4">Synchronizing_Nodal_Link...</div>
        <div className="w-48 h-[1px] bg-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/60 animate-progress" />
        </div>
      </div>}>
        <Outlet />
      </React.Suspense>
    </AppShell>
  );
}

// Create a root route
const rootRoute = new RootRoute({
  component: Root,
  notFoundComponent: () => <NotFound />,
});

function Welcome() {
  return (
    <Orphanage />
  );
}

// Create child routes
const indexRoute = new Route({ getParentRoute: () => rootRoute, path: "/", component: Dashboard });
const runRoundRoute = new Route({ getParentRoute: () => rootRoute, path: "/run-round", component: RunRound });
const warriorDetailRoute = new Route({ getParentRoute: () => rootRoute, path: "/warrior/$id", component: WarriorDetail });
const welcomeRoute = new Route({ getParentRoute: () => rootRoute, path: "/welcome", component: Welcome });

// Pillar 2: Stable Management
const stablePillar = new Route({ getParentRoute: () => rootRoute, path: "/stable" });
const stableIndexRoute = new Route({ getParentRoute: () => stablePillar, path: "/", component: StableHall });
const stableDetailRoute = new Route({ getParentRoute: () => stablePillar, path: "/$id", component: StableDetail });
const stableTrainingRoute = new Route({ getParentRoute: () => stablePillar, path: "/training", component: Training });
const stableRecruitRoute = new Route({ getParentRoute: () => stablePillar, path: "/recruit", component: Recruit });
const stableGearRoute = new Route({ getParentRoute: () => stablePillar, path: "/equipment", component: EquipmentOptimizerPage });
const stablePlannerRoute = new Route({ getParentRoute: () => stablePillar, path: "/planner", component: TrainingPlanner });
const stableTrainersRoute = new Route({ getParentRoute: () => stablePillar, path: "/trainers", component: Trainers });
const stableFinanceRoute = new Route({ getParentRoute: () => stablePillar, path: "/finance", component: StableLedger });
const stableContractsRoute = new Route({ getParentRoute: () => stablePillar, path: "/contracts", component: BookingOffice });

// Pillar 3: World
const worldPillar = new Route({ getParentRoute: () => rootRoute, path: "/world" });
const worldIndexRoute = new Route({ getParentRoute: () => worldPillar, path: "/", component: WorldOverview });
const worldTournamentsRoute = new Route({ getParentRoute: () => worldPillar, path: "/tournaments", component: Tournaments });
const worldScoutingRoute = new Route({ getParentRoute: () => worldPillar, path: "/scouting", component: Scouting });
const worldGazetteRoute = new Route({ getParentRoute: () => worldPillar, path: "/gazette", component: Gazette });
const worldHistoryRoute = new Route({ getParentRoute: () => worldPillar, path: "/history", component: HallOfFights });

// Pillar 4: Legacy
const legacyPillar = new Route({ getParentRoute: () => rootRoute, path: "/legacy" });
const legacyIndexRoute = new Route({ getParentRoute: () => legacyPillar, path: "/", component: Graveyard });
const legacyHoFRoute = new Route({ getParentRoute: () => legacyPillar, path: "/hall-of-fame", component: HallOfFame });
const legacyAnalyticsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/analytics", component: KillAnalytics });
const legacyAwardsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/awards", component: SeasonalAwards });
const legacyTourneyAwardsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/tournament-awards", component: TournamentAwards });

// Development / Help Tools
const helpRoute = new Route({ getParentRoute: () => rootRoute, path: "/help", component: Help });

// Create the route tree
const routeTree = rootRoute.addChildren([
  welcomeRoute,
  indexRoute,
  runRoundRoute,
  warriorDetailRoute,
  stablePillar.addChildren([
    stableIndexRoute,
    stableDetailRoute,
    stableTrainingRoute,
    stableRecruitRoute,
    stableGearRoute,
    stablePlannerRoute,
    stableTrainersRoute,
    stableFinanceRoute,
    stableContractsRoute,
  ]),
  worldPillar.addChildren([
    worldIndexRoute,
    worldTournamentsRoute,
    worldScoutingRoute,
    worldGazetteRoute,
    worldHistoryRoute,
  ]),
  legacyPillar.addChildren([
    legacyIndexRoute,
    legacyHoFRoute,
    legacyAnalyticsRoute,
    legacyAwardsRoute,
    legacyTourneyAwardsRoute,
  ]),
  helpRoute,
]);

// Create the router
export const router = new Router({
  routeTree,
  // history: typeof window !== "undefined" ? createBrowserHistory() : createMemoryHistory()
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
