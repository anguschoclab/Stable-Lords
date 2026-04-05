import { createFileRoute } from "@tanstack/react-router";
import TrainingPlanner from "@/pages/TrainingPlanner";

export const Route = createFileRoute("/stable/planner")({
  component: TrainingPlanner,
});
