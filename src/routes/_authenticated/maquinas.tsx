import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/maquinas")({
  head: () => ({ meta: [{ title: "Máquinas — AxonCheck" }] }),
  component: () => <PlaceholderPage title="Máquinas" />,
});