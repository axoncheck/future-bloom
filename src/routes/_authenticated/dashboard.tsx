import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, ClipboardCheck, Truck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type Company = Database["public"]["Tables"]["companies"]["Row"];

type DashboardCounts = {
  activeCompanies: number;
  activeOperators: number;
  activeMachines: number;
  todayChecklists: number;
};

const initialCounts: DashboardCounts = {
  activeCompanies: 0,
  activeOperators: 0,
  activeMachines: 0,
  todayChecklists: 0,
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AxonCheck" },
      { name: "description", content: "Resumo operacional do Diário de Bordo Digital." },
      { property: "og:title", content: "Dashboard — AxonCheck" },
      { property: "og:description", content: "Indicadores de empresas, operadores e máquinas." },
    ],
  }),
  component: DashboardPage,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

async function getCount(
  table: "companies" | "users" | "machines" | "checklists",
  filter?: { column: string; value: string | boolean },
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function DashboardPage() {
  const [counts, setCounts] = useState(initialCounts);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [activeCompanies, activeOperators, activeMachines, todayChecklists, latestCompanies] =
          await Promise.all([
            getCount("companies", { column: "is_active", value: true }),
            getCount("users", { column: "is_active", value: true }),
            getCount("machines", { column: "is_active", value: true }),
            supabase
              .from("checklists")
              .select("id", { count: "exact", head: true })
              .gte("created_at", today.toISOString())
              .then(({ count, error }) => {
                if (error) throw error;
                return count ?? 0;
              }),
            supabase.from("companies").select("*").order("created_at", { ascending: false }).limit(5),
          ]);

        if (latestCompanies.error) throw latestCompanies.error;

        if (mounted) {
          setCounts({ activeCompanies, activeOperators, activeMachines, todayChecklists });
          setCompanies(latestCompanies.data ?? []);
        }
      } catch {
        if (mounted) setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { title: "Empresas Ativas", value: counts.activeCompanies, icon: Building2 },
    { title: "Operadores Ativos", value: counts.activeOperators, icon: Users },
    { title: "Máquinas Ativas", value: counts.activeMachines, icon: Truck },
    { title: "Checklists Hoje", value: counts.todayChecklists, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da operação em tempo real.</p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">{loading ? "—" : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Últimas empresas cadastradas</h2>
          <p className="text-sm text-muted-foreground">Cinco registros mais recentes.</p>
        </div>
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
                  <TableCell>{company.is_active ? "Ativo" : "Inativo"}</TableCell>
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
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}