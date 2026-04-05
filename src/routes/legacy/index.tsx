import { createFileRoute } from "@tanstack/react-router";
import Graveyard from "@/pages/Graveyard";

export const Route = createFileRoute("/legacy/")({
  component: Graveyard,
});
