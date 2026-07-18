import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { CompanyForm, type CompanyFormValues } from "@/components/empresas/company-form";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/empresas/nova")({
  head: () => ({
    meta: [
      { title: "Nova Empresa — AxonCheck" },
      { name: "description", content: "Cadastro de nova empresa no AxonCheck." },
    ],
  }),
  component: NewCompanyPage,
});

function toPayload(values: CompanyFormValues) {
  const trimmed = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]),
  ) as CompanyFormValues;
  return {
    name: trimmed.name,
    legal_name: trimmed.legal_name,
    document: trimmed.document,
    phone: trimmed.phone || null,
    email: trimmed.email || null,
    address_street: trimmed.address_street || null,
    address_number: trimmed.address_number || null,
    address_complement: trimmed.address_complement || null,
    address_neighborhood: trimmed.address_neighborhood || null,
    address_city: trimmed.address_city || null,
    address_state: trimmed.address_state || null,
    address_zip: trimmed.address_zip || null,
    plan_type: trimmed.plan_type as "trial" | "basic" | "pro" | "enterprise",
  };
}

function NewCompanyPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: CompanyFormValues) {
    setSubmitting(true);
    const { error } = await supabase.from("companies").insert(toPayload(values));
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível salvar a empresa.", { description: error.message });
      return;
    }
    toast.success("Empresa cadastrada com sucesso.");
    navigate({ to: "/empresas" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nova empresa</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados para cadastrar um novo cliente.</p>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <CompanyForm
          submitLabel="Salvar"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/empresas" })}
        />
      </div>
    </div>
  );
}