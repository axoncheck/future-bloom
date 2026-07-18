import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/operadores")({
  head: () => ({ meta: [{ title: "Operadores — AxonCheck" }] }),
  component: () => <PlaceholderPage title="Operadores" />,
});