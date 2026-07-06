# Auditoria — Migração Supabase → PostgreSQL local

**Branch:** `feat/local-postgres-windows-production`  
**Decisão:** Produção em Windows Server Azure com PostgreSQL, auth e storage locais — **sem Supabase**.

## Resumo executivo (Fase 2)

| Métrica | Fase 1 | Fase 2 |
|---------|--------|--------|
| Arquivos importando `@/lib/supabase/server` | ~90 | ~90 (adapter — roteia para PG local) |
| Imports diretos `@supabase/*` em módulos | ~90 | **0 no fluxo runtime local** (via adapter) |
| Migrations locais | 1 | **12 arquivos** (`db/migrations/local/`) |
| Cliente PostgreSQL compatível | Não | **Sim** (`src/lib/supabase/local/`) |
| Auth/Storage/Reset completos | Parcial | **Sim** (APIs + páginas) |
| Veredito | BLOQUEADO | **Revisão de merge — validar em PG real** |

---

## Tabela de impacto

| Área | Uso atual de Supabase | Impacto | Substituição local | Complexidade | Bloqueia produção? |
|------|----------------------|---------|-------------------|--------------|---------------------|
| **Autenticação login/logout** | `supabase.auth.signInWithPassword`, middleware SSR cookies | Crítico | JWT + `user_sessions` + bcrypt (`src/modules/core/auth/local/`) | Média | Parcial — fundação pronta, módulos ainda mistos |
| **Sessão / RBAC** | `getSessionContext()` via Supabase + RLS | Crítico | Branch local em `session.ts` + `session-context.ts` (pg) | Alta | Sim — queries de módulos ainda usam Supabase |
| **Middleware** | `createServerClient` + `auth.getUser()` | Crítico | `middleware.local.ts` + JWT edge | Média | Parcial — implementado para local |
| **Admin criar usuário** | `admin.auth.admin.createUser` | Crítico | `createLocalUserWithPassword` — **não wired em user-actions** | Média | Sim |
| **Reset senha** | Supabase Auth e-mail | Alto | `password_reset_tokens` + API local (stub SMTP) | Média | Sim |
| **PostgreSQL dados** | Supabase hosted + PostgREST via JS client | Crítico | `pg` pool + migrar ~110 arquivos `.from()` | **Muito alta** | **Sim** |
| **RLS** | 28 migrations com `auth.uid()` policies | Crítico | Guards servidor (`guards.ts`) + filtros tenant obrigatórios | **Muito alta** | **Sim** |
| **Storage anexos** | `supabase.storage.from().upload` | Alto | `local-provider.ts` + `/api/files/local` | Média | Sim — rotas upload ainda Supabase |
| **URLs assinadas vídeo/PDF** | `createSignedUrl` | Alto | `storageProtectedUrl` endpoint autenticado | Média | Sim |
| **Certificados PDF** | Storage + DB via Supabase | Alto | Storage local + pg queries | Alta | Sim |
| **Multi-tenant** | RLS + `tenant_id` | Crítico | Sessão + `assertEntityTenant` | Alta | Sim |
| **Auditoria** | `audit_events` via Supabase insert | Médio | `query()` insert — parcial em auth local | Baixa | Parcial |
| **Scripts QA/staging** | `provision-qa-users`, fixtures | Médio | Manter para dev Supabase; bloqueados em prod | Baixa | Não (dev only) |
| **test:rls** | JWT Supabase real | Alto | Novo `test:authz:local` necessário | Alta | Sim para CI local |
| **E2E Playwright** | Login QA Supabase | Alto | Perfil env local + bootstrap | Alta | Sim |
| **Tipos** | `src/types/supabase.ts` | Médio | Tipos pg / Drizzle futuro | Média | Não |
| **Realtime** | Não usado | Nenhum | — | — | Não |
| **Edge Functions** | Não usado | Nenhum | — | — | Não |

---

## Arquivos centrais Supabase (referência)

| Caminho | Função |
|---------|--------|
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server SSR client |
| `src/lib/supabase/admin.ts` | Service role |
| `src/middleware.ts` | Auth guard Supabase |
| `src/modules/core/auth/session.ts` | Sessão (branch local adicionada) |
| `src/modules/admin/actions/user-actions.ts` | Cria usuário via Auth admin |
| `src/app/api/learning/upload/route.ts` | Upload Storage |
| `src/app/api/support/upload/route.ts` | Upload Storage |
| `scripts/test-rls.ts` | Testes RLS Supabase |
| `supabase/migrations/*.sql` | Schema + RLS (28 arquivos) |

---

## O que foi implementado nesta branch

| Componente | Caminho |
|------------|---------|
| Providers (auth/db/storage) | `src/lib/providers.ts` |
| Pool PostgreSQL | `src/lib/db/pool.ts` |
| Auth local (senha, sessão, JWT) | `src/modules/core/auth/local/*` |
| Guards autorização | `src/modules/core/auth/guards.ts` |
| Storage local | `src/modules/core/files/storage/local-provider.ts` |
| Migration auth local | `db/migrations/local/001_local_auth.sql` |
| Bootstrap admin local | `scripts/production/bootstrap-local-admin.ts` |
| Grupos locais | `scripts/production/provision-local-access-groups.ts` |
| Migrate runner | `scripts/db-migrate-local-prod.ts` |
| Login API local | `src/app/api/auth/local/login/route.ts` |
| Middleware local | `src/middleware.local.ts` |

---

## Plano de desacoplamento (fases)

### Fase 1 — Fundação (esta branch) ✅ parcial
- [x] Audit document
- [x] Auth local core
- [x] Storage interface local
- [x] Guards
- [x] Env + scripts bootstrap
- [ ] Converter schema Supabase → PG puro (28 migrations)

### Fase 2 — Data layer (próxima)
- [ ] `src/lib/db/repository.ts` ou Drizzle ORM
- [ ] Substituir `createClient()` por `getDb()` em módulos
- [ ] Remover dependência `@supabase/supabase-js` do runtime produção

### Fase 3 — Uploads e mídia
- [ ] Migrar rotas `/api/learning/upload`, `/api/support/upload`
- [ ] Player vídeo com endpoint protegido local

### Fase 4 — Admin + reset senha completo
- [ ] `user-actions.ts` branch local
- [ ] SMTP ou fluxo admin manual reset
- [ ] `/esqueci-senha` + `/redefinir-senha` local

### Fase 5 — Testes e go-live
- [ ] `test:authz:local`
- [ ] E2E com stack local
- [ ] Runbook validado no servidor

---

## Veredito

**BLOQUEADO — SISTEMA AINDA DEPENDE DE SUPABASE** para operação completa dos módulos homologados.

A fundação para migração local está iniciada e documentada. A próxima etapa crítica é **substituir o client Supabase nos módulos de negócio** (~110 arquivos) e **converter migrations RLS** para enforcement no servidor.
