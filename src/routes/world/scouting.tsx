import { createFileRoute } from "@tanstack/react-router";
import Scouting from "@/pages/Scouting";

export const Route = createFileRoute("/world/scouting")({
  component: Scouting,
});
