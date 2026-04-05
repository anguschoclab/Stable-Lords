import { createFileRoute } from "@tanstack/react-router";
import SeasonalAwards from "@/pages/SeasonalAwards";

export const Route = createFileRoute("/legacy/awards")({
  component: SeasonalAwards,
});
