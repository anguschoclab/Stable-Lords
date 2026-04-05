import { createFileRoute } from "@tanstack/react-router";
import HallOfFights from "@/lore/HallOfFights";

export const Route = createFileRoute("/world/history")({
  component: HallOfFights,
});
