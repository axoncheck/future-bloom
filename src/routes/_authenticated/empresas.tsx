import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export const Route = createFileRoute("/_authenticated/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — AxonCheck" },
      { name: "description", content: "Listagem de empresas cadastradas no AxonCheck." },
      { property: "og:title", content: "Empresas — AxonCheck" },
      { property: "og:description", content: "Consulta de empresas, planos e status." },
    ],
  }),
  component: CompaniesPage,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (fetchError) {
        setError("Não foi possível carregar as empresas.");
      } else {
        setCompanies(data ?? []);
      }
      setLoading(false);
    }

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground">Cadastro e consulta de clientes da operação.</p>
        </div>
        <Button>
          <Plus className="size-4" />
          Nova Empresa
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.document ?? "—"}</TableCell>
                <TableCell className="capitalize">{company.plan_type}</TableCell>
                <TableCell>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                    {company.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>{formatDate(company.created_at)}</TableCell>
              </TableRow>
            ))}
            {!loading && companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma empresa cadastrada.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Carregando empresas...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}