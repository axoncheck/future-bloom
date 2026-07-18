import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/os")({
  head: () => ({ meta: [{ title: "OS — AxonCheck" }] }),
  component: () => <PlaceholderPage title="OS" />,
});