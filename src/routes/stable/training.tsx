import { createFileRoute } from "@tanstack/react-router";
import Training from "@/pages/Training";

export const Route = createFileRoute("/stable/training")({
  component: Training,
});
