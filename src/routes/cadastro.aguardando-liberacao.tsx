import { Link, createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import axonLogo from "@/assets/axon-logo.png.asset.json";

const WHATSAPP_NUMBER = "5565992334119";
const WHATSAPP_MESSAGE =
  "Olá, acabei de me cadastrar no AxonCheck e gostaria de liberar meu acesso.";

export const Route = createFileRoute("/cadastro/aguardando-liberacao")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Aguardando liberação — AxonCheck" },
      {
        name: "description",
        content: "Cadastro recebido. Fale com o suporte pelo WhatsApp para liberar o acesso.",
      },
    ],
  }),
  component: AguardandoLiberacaoPage,
});

function AguardandoLiberacaoPage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
        <img
          src={axonLogo.url}
          alt="Axon"
          className="mx-auto mb-6 size-16 rounded-xl object-contain shadow-sm"
        />
        <h1 className="text-2xl font-semibold text-foreground">Cadastro recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enviamos um email de confirmação para o endereço cadastrado. Antes de acessar o sistema,
          entre em contato pelo WhatsApp para que nossa equipe libere o seu acesso.
        </p>

        <div className="mt-8 space-y-3">
          <Button asChild className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-5" />
              Falar no WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Assim que seu acesso for liberado, você poderá entrar normalmente com o email e senha
          cadastrados.
        </p>
      </section>
    </main>
  );
}