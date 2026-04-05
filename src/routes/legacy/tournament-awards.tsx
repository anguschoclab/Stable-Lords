import { createFileRoute } from "@tanstack/react-router";
import TournamentAwards from "@/pages/TournamentAwards";

export const Route = createFileRoute("/legacy/tournament-awards")({
  component: TournamentAwards,
});
