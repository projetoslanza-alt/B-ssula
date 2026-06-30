# Plataforma Bússola — Módulo Universidade

SaaS B2B multi-tenant para capacitação corporativa, desenvolvimento de equipes e trilhas de aprendizado.

> Todos podem aprender. Gestores orientam a rota. A empresa acompanha a evolução.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Banco/Auth/Storage:** Supabase (PostgreSQL + RLS)
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 20+
- Conta Supabase
- npm

## Configuração local

1. Clone o repositório e instale dependências:

```bash
npm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha `.env.local` com credenciais do Supabase.

4. Com Supabase local (`npx supabase start`), aplique migrations e massa QA:

```bash
npx supabase db reset
npm run qa:setup:local
```

Documentação completa: [docs/qa-users.md](docs/qa-users.md)

5. Inicie o servidor:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Verificação TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes e2e (Playwright) |
| `npm run test:rls` | Testes RLS com JWT real |
| `npm run qa:setup:local` | Provisiona tenants e usuários QA locais |
| `npm run qa:users:list` | Lista fixtures QA no banco |

## Estrutura principal

```
src/
├── app/                    # Rotas (auth, universidade, api)
├── components/             # UI, layout, feedback
├── modules/
│   ├── core/               # Auth, auditoria, tenancy
│   └── learning/           # Domínio Universidade
├── lib/                    # Supabase, env, utils
supabase/migrations/        # SQL versionado
docs/                       # Arquitetura, deploy, roadmap
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Modelo de dados](docs/data-model.md)
- [Permissões](docs/permissions.md)
- [Deploy](docs/deployment.md)
- [Plano de implementação](docs/implementation-plan.md)
- [Roadmap](docs/roadmap.md)

## Primeiro administrador

Após criar usuário no Supabase Auth:

1. Crie organização e membership no banco
2. Atribua papel `org_admin` via `membership_roles`
3. Defina `user_organization_context.active_tenant_id`

Detalhes em [docs/deployment.md](docs/deployment.md).

## Health check

```
GET /api/health
```

## Licença

Proprietário — Lanza / Bússola
