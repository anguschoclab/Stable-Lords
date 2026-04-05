import { createFileRoute } from "@tanstack/react-router";
import StableLedger from "@/pages/StableLedger";

export const Route = createFileRoute("/stable/finance")({
  component: StableLedger,
});
