import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type PlanType = "trial" | "basic" | "pro" | "enterprise";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
  { value: "America/Manaus", label: "Manaus (America/Manaus)" },
  { value: "America/Fortaleza", label: "Fortaleza (America/Fortaleza)" },
] as const;

const REMINDER_HOURS = ["08:00", "12:00", "16:00"] as const;

const PLAN_META: Record<PlanType, { label: string; price: string; badge: string }> = {
  trial: {
    label: "Trial",
    price: "Grátis por 30 dias",
    badge: "bg-muted text-muted-foreground",
  },
  basic: {
    label: "Basic",
    price: "R$ 199/mês",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  pro: {
    label: "Pro",
    price: "R$ 499/mês",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  },
  enterprise: {
    label: "Enterprise",
    price: "Sob consulta",
    badge: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  },
};

type Settings = {
  timezone: string;
  auto_reminder_enabled: boolean;
  reminder_hours: string[];
};

function parseSettings(raw: unknown): Settings {
  const obj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) ?? {};
  const timezone =
    typeof obj.timezone === "string" && TIMEZONES.some((t) => t.value === obj.timezone)
      ? (obj.timezone as string)
      : "America/Sao_Paulo";
  const auto_reminder_enabled = Boolean(obj.auto_reminder_enabled);
  const reminder_hours = Array.isArray(obj.reminder_hours)
    ? (obj.reminder_hours as unknown[]).filter(
        (h): h is string => typeof h === "string" && (REMINDER_HOURS as readonly string[]).includes(h),
      )
    : [];
  return { timezone, auto_reminder_enabled, reminder_hours };
}

export const Route = createFileRoute("/_authenticated/empresas/$id/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da Empresa — AxonCheck" },
      { name: "description", content: "Configure fuso horário, lembretes e plano da empresa." },
    ],
  }),
  component: CompanySettingsPage,
});

function CompanySettingsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    timezone: "America/Sao_Paulo",
    auto_reminder_enabled: false,
    reminder_hours: [],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("trial");
  const [confirmPlanOpen, setConfirmPlanOpen] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

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
        setCompany(data);
        setSettings(parseSettings(data.settings));
        setSelectedPlan(data.plan_type as PlanType);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const currentPlan = company?.plan_type as PlanType | undefined;
  const planMeta = useMemo(
    () => (currentPlan ? PLAN_META[currentPlan] : null),
    [currentPlan],
  );

  async function refreshCompany() {
    const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
    if (data) setCompany(data);
  }

  async function handleToggleActive(next: boolean) {
    if (!company) return;
    if (!next) {
      setDeactivateOpen(true);
      return;
    }
    setTogglingActive(true);
    const { error } = await supabase.from("companies").update({ is_active: true }).eq("id", id);
    setTogglingActive(false);
    if (error) {
      toast.error("Não foi possível atualizar o status.", { description: error.message });
      return;
    }
    toast.success("Empresa ativada.");
    await refreshCompany();
  }

  async function confirmDeactivate() {
    setTogglingActive(true);
    const { error } = await supabase.from("companies").update({ is_active: false }).eq("id", id);
    setTogglingActive(false);
    setDeactivateOpen(false);
    if (error) {
      toast.error("Não foi possível desativar.", { description: error.message });
      return;
    }
    toast.success("Empresa desativada.");
    await refreshCompany();
  }

  async function handleSaveSettings() {
    if (!company) return;
    setSavingSettings(true);
    const currentSettings =
      company.settings && typeof company.settings === "object"
        ? (company.settings as Record<string, unknown>)
        : {};
    const nextSettings = {
      ...currentSettings,
      timezone: settings.timezone,
      auto_reminder_enabled: settings.auto_reminder_enabled,
      reminder_hours: settings.auto_reminder_enabled ? settings.reminder_hours : [],
    };
    const { error } = await supabase
      .from("companies")
      .update({ settings: nextSettings })
      .eq("id", id);
    setSavingSettings(false);
    if (error) {
      toast.error("Não foi possível salvar.", { description: error.message });
      return;
    }
    toast.success("Configurações atualizadas.");
    await refreshCompany();
  }

  async function confirmChangePlan() {
    setChangingPlan(true);
    const { error } = await supabase
      .from("companies")
      .update({ plan_type: selectedPlan })
      .eq("id", id);
    setChangingPlan(false);
    setConfirmPlanOpen(false);
    setPlanDialogOpen(false);
    if (error) {
      toast.error("Não foi possível alterar o plano.", { description: error.message });
      return;
    }
    toast.success("Plano alterado.");
    await refreshCompany();
  }

  function toggleHour(hour: string, checked: boolean) {
    setSettings((prev) => ({
      ...prev,
      reminder_hours: checked
        ? Array.from(new Set([...prev.reminder_hours, hour]))
        : prev.reminder_hours.filter((h) => h !== hour),
    }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  if (notFound || !company) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Configurações da empresa</h1>
          <p className="text-sm text-muted-foreground">{company.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/empresas/$id/editar" params={{ id }}>Editar dados</Link>
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/empresas" })}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Informações */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Informações da empresa
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ReadOnly label="Nome" value={company.name} />
          <ReadOnly label="CNPJ" value={company.document ?? "—"} />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Plano</p>
            {planMeta && (
              <span
                className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-medium ${planMeta.badge}`}
              >
                {planMeta.label}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Empresa {company.is_active ? "ativa" : "inativa"}
            </p>
            <p className="text-xs text-muted-foreground">
              Empresas inativas deixam de aparecer nas operações e nos dashboards.
            </p>
          </div>
          <Switch
            checked={company.is_active}
            disabled={togglingActive}
            onCheckedChange={handleToggleActive}
          />
        </div>
      </section>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              A empresa deixará de aparecer em listagens operacionais, novos checklists ficam
              bloqueados e os operadores perdem acesso. Você pode reativá-la a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingActive}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} disabled={togglingActive}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sistema */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Configurações do sistema
        </h2>
        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Fuso horário</Label>
            <Select
              value={settings.timezone}
              onValueChange={(v) => setSettings((s) => ({ ...s, timezone: v }))}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Lembrete automático</p>
              <p className="text-xs text-muted-foreground">
                Envia lembretes de checklist nos horários selecionados.
              </p>
            </div>
            <Switch
              checked={settings.auto_reminder_enabled}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, auto_reminder_enabled: v }))
              }
            />
          </div>

          {settings.auto_reminder_enabled && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Horários dos lembretes</Label>
              <div className="flex flex-wrap gap-4">
                {REMINDER_HOURS.map((hour) => {
                  const checked = settings.reminder_hours.includes(hour);
                  return (
                    <label
                      key={hour}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleHour(hour, Boolean(v))}
                      />
                      {hour}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </section>

      {/* Plano */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plano
        </h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {planMeta && (
            <div className="space-y-1">
              <span
                className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${planMeta.badge}`}
              >
                {planMeta.label}
              </span>
              <p className="text-sm font-medium text-foreground">{planMeta.price}</p>
            </div>
          )}
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Alterar Plano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar plano</DialogTitle>
                <DialogDescription>
                  Escolha o plano ideal para a operação desta empresa.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                {(Object.keys(PLAN_META) as PlanType[]).map((plan) => {
                  const meta = PLAN_META[plan];
                  const active = selectedPlan === plan;
                  return (
                    <button
                      type="button"
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                        active ? "border-primary bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{meta.price}</p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPlanDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => setConfirmPlanOpen(true)}
                  disabled={selectedPlan === currentPlan}
                >
                  Continuar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <AlertDialog open={confirmPlanOpen} onOpenChange={setConfirmPlanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de plano?</AlertDialogTitle>
            <AlertDialogDescription>
              O plano de <strong>{company.name}</strong> será alterado para{" "}
              <strong>{PLAN_META[selectedPlan].label}</strong> ({PLAN_META[selectedPlan].price}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingPlan}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePlan} disabled={changingPlan}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}