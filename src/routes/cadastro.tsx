import { FormEvent, useState } from "react";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { maskPhone, unmask } from "@/lib/masks";
import axonLogo from "@/assets/axon-logo.png.asset.json";

export const Route = createFileRoute("/cadastro")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Cadastro — AxonCheck" },
      { name: "description", content: "Crie sua conta no Diário de Bordo Digital AxonCheck." },
    ],
  }),
  component: CadastroPage,
});

type Errors = Partial<Record<"name" | "email" | "phone" | "company" | "password" | "confirm", string>>;

function CadastroPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido.";
    const digits = unmask(phone);
    if (digits.length < 10 || digits.length > 11) e.phone = "Telefone inválido.";
    if (company.trim().length < 2) e.company = "Informe o nome da empresa.";
    if (password.length < 8) e.password = "Mínimo de 8 caracteres.";
    if (confirm !== password) e.confirm = "As senhas não coincidem.";
    return e;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            company: company.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("registered") || msg.includes("exists")) {
          setSubmitError("Este email já está cadastrado.");
        } else if (msg.includes("password") || msg.includes("pwned")) {
          setSubmitError("Senha muito fraca ou vazada. Use uma senha mais forte.");
        } else {
          setSubmitError("Não foi possível concluir o cadastro. Tente novamente.");
        }
        return;
      }
      navigate({ to: "/cadastro/aguardando-liberacao", replace: true });
    } catch {
      setSubmitError("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={axonLogo.url}
            alt="Axon"
            className="mb-4 size-16 rounded-xl object-contain shadow-sm"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Criar conta</h1>
          <p className="text-sm text-muted-foreground">AxonCheck — Diário de Bordo Digital</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Nome completo" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={160}
              autoComplete="email"
            />
          </Field>
          <Field label="Telefone (WhatsApp)" error={errors.phone}>
            <Input
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          <Field label="Empresa" error={errors.company}>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} />
          </Field>
          <Field label="Senha" error={errors.password}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar senha" error={errors.confirm}>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          {submitError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}