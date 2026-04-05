import { createFileRoute } from "@tanstack/react-router";
import Gazette from "@/pages/Gazette";

export const Route = createFileRoute("/world/gazette")({
  component: Gazette,
});
