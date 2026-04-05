import { createFileRoute } from "@tanstack/react-router";
import KillAnalytics from "@/pages/KillAnalytics";

export const Route = createFileRoute("/legacy/analytics")({
  component: KillAnalytics,
});
