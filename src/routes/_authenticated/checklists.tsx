import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/checklists")({
  head: () => ({ meta: [{ title: "Checklists — AxonCheck" }] }),
  component: () => <PlaceholderPage title="Checklists" />,
});