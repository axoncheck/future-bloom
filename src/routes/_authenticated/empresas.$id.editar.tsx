import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CompanyForm,
  emptyCompany,
  type CompanyFormValues,
} from "@/components/empresas/company-form";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export const Route = createFileRoute("/_authenticated/empresas/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar Empresa — AxonCheck" },
      { name: "description", content: "Edição de empresa cadastrada no AxonCheck." },
    ],
  }),
  component: EditCompanyPage,
});

function toFormValues(row: Company): CompanyFormValues {
  return {
    name: row.name ?? "",
    legal_name: row.legal_name ?? "",
    document: row.document ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address_street: row.address_street ?? "",
    address_number: row.address_number ?? "",
    address_complement: row.address_complement ?? "",
    address_neighborhood: row.address_neighborhood ?? "",
    address_city: row.address_city ?? "",
    address_state: row.address_state ?? "",
    address_zip: row.address_zip ?? "",
    plan_type: row.plan_type ?? "trial",
  };
}

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

function EditCompanyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<CompanyFormValues | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setInitial(toFormValues(data));
        setIsActive(data.is_active);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(values: CompanyFormValues) {
    setSubmitting(true);
    const { error } = await supabase.from("companies").update(toPayload(values)).eq("id", id);
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível salvar as alterações.", { description: error.message });
      return;
    }
    toast.success("Empresa atualizada.");
    navigate({ to: "/empresas" });
  }

  async function handleDeactivate() {
    setDeleting(true);
    const { error } = await supabase
      .from("companies")
      .update({ is_active: false })
      .eq("id", id);
    setDeleting(false);
    if (error) {
      toast.error("Não foi possível desativar a empresa.", { description: error.message });
      return;
    }
    toast.success("Empresa desativada.");
    navigate({ to: "/empresas" });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">Carregando empresa...</p>
      </div>
    );
  }

  if (notFound || !initial) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Empresa não encontrada</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/empresas" })}>
          Voltar para empresas
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Editar empresa</h1>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Empresa ativa." : "Empresa inativa."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/empresas/$id/configuracoes" params={{ id }}>
            Configurações
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <CompanyForm
          initialValues={initial ?? emptyCompany}
          submitLabel="Salvar"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/empresas" })}
          extraActions={
            isActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={deleting}>
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desativar empresa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A empresa será marcada como inativa e deixará de aparecer nas operações.
                      Você pode reativá-la depois editando novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate}>
                      Desativar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null
          }
        />
      </div>
    </div>
  );
}