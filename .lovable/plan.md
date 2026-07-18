## Objetivo
Adicionar criação, edição e exclusão de empresas no AxonCheck, com formulário completo, máscaras, validação e navegação a partir da listagem.

## Mudanças no backend (Lovable Cloud)

A tabela `companies` hoje só tem política de leitura para usuários autenticados — INSERT, UPDATE e DELETE estão bloqueados, então salvar/editar/excluir vai falhar silenciosamente por RLS. Precisamos de uma migração adicionando:

- Política de INSERT para `authenticated`
- Política de UPDATE para `authenticated`
- Política de DELETE para `authenticated` (ou manter DELETE bloqueado e usar apenas "desativar" via `is_active = false`)

**Decisão pendente:** o pedido diz "Botão Excluir que abre modal e faz DELETE (ou desativa a empresa)". Vou seguir com **soft delete** (UPDATE `is_active = false`) por padrão — é mais seguro (empresa pode ter operadores, máquinas e checklists vinculados por FK) e não exige política de DELETE. Se preferir DELETE real, me avise.

Observação: como qualquer usuário autenticado hoje pode ver/editar todas as empresas (não há vínculo `company_id` no usuário nem verificação de role), essa é uma limitação já existente do modelo atual — não é escopo desta tarefa apertar isso, mas vale registrar.

## Novas rotas

```
src/routes/_authenticated/
  empresas.tsx              (já existe — listagem, ajustar)
  empresas.nova.tsx         (novo — formulário de criação)
  empresas.$id.editar.tsx   (novo — formulário de edição + excluir)
```

Ambos os formulários compartilham a mesma UI, então extraio um componente:

```
src/components/empresas/company-form.tsx   (form reusável)
src/lib/masks.ts                            (máscaras CNPJ/telefone/CEP)
```

## Formulário (`CompanyForm`)

Campos, na ordem pedida:

- **Dados**: Nome*, Razão Social*, CNPJ* (máscara `XX.XXX.XXX/XXXX-XX`), Telefone (máscara `(XX) XXXXX-XXXX`), Email
- **Endereço**: Logradouro, Número, Complemento, Bairro, Cidade, Estado (select com as 27 UFs), CEP (máscara `XXXXX-XXX`)
- **Plano**: select `trial | basic | pro | enterprise`

Validação com `zod` + `react-hook-form` (já em uso no projeto via shadcn):
- `name`, `legal_name`, `document` obrigatórios (trim, não vazio, max length)
- `email` opcional mas valida formato quando preenchido
- `document` valida 14 dígitos (após remover máscara)
- Estado limitado a 2 letras maiúsculas
- Todos os campos com `.max(...)` conservador

Máscaras aplicadas no `onChange` do input, mas o valor salvo no Supabase mantém a máscara (padrão brasileiro comum e o schema é `VARCHAR`).

Botões:
- **Salvar** — INSERT (nova) ou UPDATE (editar) via `supabase.from('companies')`. Toast de sucesso/erro (`sonner`, já disponível). Após sucesso: `navigate({ to: '/empresas' })`.
- **Cancelar** — `navigate({ to: '/empresas' })` sem salvar.
- **Excluir** (só na edição) — abre `AlertDialog` do shadcn; ao confirmar, UPDATE `is_active = false` e redireciona para `/empresas`.

## Rota de edição

`empresas.$id.editar.tsx`:
- Carrega a empresa via `supabase.from('companies').select('*').eq('id', id).single()` num `useEffect` (mesmo padrão da listagem atual).
- Estado de loading enquanto busca; se não encontrar, mostra mensagem e link de volta.
- Passa os dados como `defaultValues` para o `CompanyForm`.

## Ajustes em `empresas.tsx` (listagem)

- Botão "Nova Empresa" vira `<Link to="/empresas/nova">` (via `asChild` no `Button`).
- Nova coluna "Ações" com botão "Editar" → `<Link to="/empresas/$id/editar" params={{ id: company.id }}>`.
- Badge de status colorido: verde (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-400`) para Ativo, vermelho (`bg-destructive/15 text-destructive`) para Inativo — usando tokens semânticos existentes.

## Detalhes técnicos

- Todas as rotas ficam sob `_authenticated/` (o guard já existe).
- Uso `useNavigate` do TanStack Router para redirects após salvar/cancelar/excluir.
- Não uso `createServerFn` — as escritas vão direto pelo client Supabase respeitando RLS do usuário autenticado, coerente com o padrão já adotado na listagem e no dashboard.
- Nenhuma alteração em arquivos auto-gerados (`routeTree.gen.ts`, `client.ts`, `types.ts`).

## Pergunta antes de implementar

Confirma **soft delete** (desativa via `is_active = false`) em vez de DELETE real? É o caminho mais seguro dadas as FKs de operadores/máquinas/checklists.
