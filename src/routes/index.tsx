import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AxonCheck — Diário de Bordo Digital" },
      {
        name: "description",
        content: "Acesse o painel AxonCheck para acompanhar empresas, máquinas e checklists.",
      },
      { property: "og:title", content: "AxonCheck — Diário de Bordo Digital" },
      {
        property: "og:description",
        content: "Painel seguro para a gestão digital da operação de campo.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Navigate to="/login" replace />;
}
