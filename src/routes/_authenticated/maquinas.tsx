import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Power,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/maquinas")({
  head: () => ({
    meta: [
      { title: "Máquinas — AxonCheck" },
      {
        name: "description",
        content: "Painel analítico do maquinário: status, checklists e desempenho.",
      },
      { property: "og:title", content: "Máquinas — AxonCheck" },
      {
        property: "og:description",
        content: "Métricas visuais do maquinário monitorado no AxonCheck.",
      },
    ],
  }),
  component: MachinesDashboardPage,
});

type MachineRow = {
  id: string;
  name: string;
  identifier: string | null;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
};

type ChecklistRow = {
  id: string;
  machine_id: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

type CompanyRow = { id: string; name: string };

const STATUS_COLORS: Record<ChecklistRow["status"], string> = {
  completed: "hsl(142 71% 45%)",
  pending: "hsl(38 92% 50%)",
  failed: "hsl(0 84% 60%)",
};

const STATUS_LABELS: Record<ChecklistRow["status"], string> = {
  completed: "Concluídos",
  pending: "Pendentes",
  failed: "Falhas",
};

function MachinesDashboardPage() {
  const [machines, setMachines] = useState<MachineRow[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const since = new Date();
        since.setDate(since.getDate() - 29);
        since.setHours(0, 0, 0, 0);

        const [m, c, co] = await Promise.all([
          supabase.from("machines").select("id,name,identifier,is_active,company_id,created_at"),
          supabase
            .from("checklists")
            .select("id,machine_id,status,created_at")
            .gte("created_at", since.toISOString()),
          supabase.from("companies").select("id,name"),
        ]);
        if (m.error) throw m.error;
        if (c.error) throw c.error;
        if (co.error) throw co.error;
        if (!mounted) return;
        setMachines((m.data ?? []) as MachineRow[]);
        setChecklists((c.data ?? []) as ChecklistRow[]);
        setCompanies((co.data ?? []) as CompanyRow[]);
      } catch {
        if (mounted) setError("Não foi possível carregar as métricas do maquinário.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const active = machines.filter((x) => x.is_active).length;
    const inactive = machines.length - active;
    const completed = checklists.filter((x) => x.status === "completed").length;
    const rate = checklists.length
      ? Math.round((completed / checklists.length) * 100)
      : 0;
    return {
      total: machines.length,
      active,
      inactive,
      checklists: checklists.length,
      completionRate: rate,
    };
  }, [machines, checklists]);

  const perMachine = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of checklists) {
      if (!c.machine_id) continue;
      counts.set(c.machine_id, (counts.get(c.machine_id) ?? 0) + 1);
    }
    return machines
      .map((m) => ({
        name: m.name.length > 14 ? `${m.name.slice(0, 14)}…` : m.name,
        total: counts.get(m.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [machines, checklists]);

  const statusData = useMemo(() => {
    const acc: Record<ChecklistRow["status"], number> = {
      completed: 0,
      pending: 0,
      failed: 0,
    };
    for (const c of checklists) acc[c.status] += 1;
    return (Object.keys(acc) as ChecklistRow["status"][]).map((k) => ({
      name: STATUS_LABELS[k],
      value: acc[k],
      color: STATUS_COLORS[k],
    }));
  }, [checklists]);

  const dailyData = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    const map = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
      days.push({
        date: key,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: 0,
      });
    }
    for (const c of checklists) {
      const key = c.created_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return days.map((d) => ({ ...d, total: map.get(d.date) ?? 0 }));
  }, [checklists]);

  const perCompany = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of machines) {
      if (!m.company_id) continue;
      counts.set(m.company_id, (counts.get(m.company_id) ?? 0) + 1);
    }
    return companies
      .map((co) => ({
        name: co.name.length > 16 ? `${co.name.slice(0, 16)}…` : co.name,
        total: counts.get(co.id) ?? 0,
      }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [machines, companies]);

  const cards = [
    { title: "Total de Máquinas", value: totals.total, icon: Truck, tint: "text-primary" },
    { title: "Máquinas Ativas", value: totals.active, icon: Power, tint: "text-emerald-600" },
    { title: "Máquinas Inativas", value: totals.inactive, icon: XCircle, tint: "text-rose-600" },
    {
      title: "Checklists (30d)",
      value: totals.checklists,
      icon: ClipboardList,
      tint: "text-primary",
    },
    {
      title: "Taxa de Conclusão",
      value: `${totals.completionRate}%`,
      icon: CheckCircle2,
      tint: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Activity className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            Painel de Máquinas
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão analítica do maquinário e checklists dos últimos 30 dias.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title} className="rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`size-5 ${card.tint}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? "—" : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Checklists por dia (últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status dos checklists</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {statusData.every((s) => s.value === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem checklists no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {statusData.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top 10 máquinas por checklists
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {perMachine.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma máquina cadastrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perMachine} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Máquinas por empresa</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {perCompany.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma máquina vinculada a empresas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={perCompany}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}