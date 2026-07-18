import { FormEvent, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — AxonCheck" },
      { name: "description", content: "Entre no Diário de Bordo Digital AxonCheck." },
      { property: "og:title", content: "Entrar — AxonCheck" },
      { property: "og:description", content: "Acesso seguro ao painel operacional." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Informe email e senha para continuar.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ClipboardCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">AxonCheck</h1>
            <p className="text-sm text-muted-foreground">Diário de Bordo Digital</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="usuario@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </section>
    </main>
  );
}