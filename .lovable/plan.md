## Objetivo

Página pública `/cadastro` que registra a conta, envia email de confirmação padrão e redireciona para uma tela pós-cadastro com CTA WhatsApp. Acesso ao sistema só depois de liberação manual.

## Novas rotas (públicas, fora de `_authenticated/`)

- **`src/routes/cadastro.tsx`** — formulário de cadastro. Se já logado, redireciona para `/dashboard`.
- **`src/routes/cadastro.aguardando-liberacao.tsx`** — tela de confirmação com botão WhatsApp.

## Formulário de cadastro

Campos com validação inline (mesmo padrão do `CompanyForm`):
- Nome completo (obrigatório, 2–120)
- Email (obrigatório, formato válido)
- Telefone / WhatsApp (obrigatório, máscara `(XX) XXXXX-XXXX`, reusa `src/lib/masks.ts`)
- Empresa (obrigatório, 2–160)
- Senha (mínimo 8 chars)
- Confirmar senha (precisa bater)

Submit → `supabase.auth.signUp({ email, password, options: { data: { name, phone, company }, emailRedirectTo: ${window.location.origin}/login } })`. Erros tratados: email duplicado, senha fraca. Sucesso → `navigate({ to: '/cadastro/aguardando-liberacao' })`.

## Tela `/cadastro/aguardando-liberacao`

- Ícone de sucesso + título "Cadastro recebido!".
- Texto: email de confirmação foi enviado, e o acesso precisa ser liberado pelo suporte.
- Botão verde grande **"Falar no WhatsApp"** → abre `https://wa.me/5565992334119?text=...` em nova aba com mensagem pré-preenchida ("Olá, acabei de me cadastrar no AxonCheck e gostaria de liberar meu acesso.").
- Botão secundário "Voltar para o login".

Uso `5565992334119` como número placeholder. Se você tiver o número oficial do suporte, me avisa que troco.

## Bloqueio de acesso (liberação manual)

Ajuste em `src/routes/_authenticated/route.tsx`: depois do `getUser()`, consulta `user_roles` do usuário. Se **não tem nenhum papel**, `supabase.auth.signOut()` + redirect para `/cadastro/aguardando-liberacao`. O usuário só entra no sistema depois que um admin inserir uma linha em `user_roles` para o `user_id` dele.

Sem migration nova — `user_roles` já existe e tem SELECT para authenticated.

## Ajuste no login

Link "Não tem conta? **Cadastre-se**" abaixo do botão Entrar, apontando para `/cadastro`.

## Email

Projeto ainda não tem domínio de email configurado, então o backend envia o email padrão de confirmação (só com o link "confirmar email"), sem branding nem botão de WhatsApp. Para email customizado com sua marca precisamos configurar um domínio de email próprio depois.

## Config do backend

`configure_auth`:
- `auto_confirm_email: false` — para o email de confirmação ser realmente enviado.
- `disable_signup: false`
- `password_hibp_enabled: true`

## Fluxo

```text
/login ──"Cadastre-se"──► /cadastro
                              │ signUp()
                              ▼
                    email de confirmação enviado
                              │
                              ▼
             /cadastro/aguardando-liberacao
                  [Falar no WhatsApp]

usuário sem role tenta entrar
        │ signIn OK → guard vê user_roles vazio
        ▼
   signOut + redirect /cadastro/aguardando-liberacao
```
