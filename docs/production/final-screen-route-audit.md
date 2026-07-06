# Auditoria final — telas, rotas e parâmetros (PostgreSQL local)

**Branch:** `fix/final-local-production-screen-audit`  
**Data:** 2026-07-06  
**Stack:** `AUTH_PROVIDER=local`, `DATABASE_PROVIDER=local_postgres`, `STORAGE_DRIVER=local`

---

## Resumo

| Área | Status |
|------|--------|
| Inventário de rotas | OK |
| Universidade / Avaliações (resultados) | **Corrigido** — SQL local + hub admin |
| Relações LocalQueryBuilder (learning) | **Corrigido** |
| Smoke E2E de rotas | **38/38 OK** (`npm run test:e2e:local-postgres:routes`, 2026-07-06) |
| E2E completo (`test:e2e:local-postgres`) | **Não repetido** nesta auditoria |
| Visual (`test:visual`) | **Não repetido** nesta auditoria |
| Servidor Windows instalado | **Não** — pendente pós-merge |
| Pronto para servidor Windows | Após merge + instalação + smoke no servidor |

---

## Correções desta auditoria

1. **`assessment-results-local.ts`** — listagem de resultados via SQL explícito (joins `profiles`, `organization_memberships`, `teams`, `assessments`, `course_versions`, `courses`, `certificates`). Título do curso via **`course_versions.title`** (`courses` não possui coluna `title`).
2. **`assessment-results.ts`** — delega ao SQL local; corrige filtro de equipe (`organization_memberships`, não `profiles.team_id`).
3. **`/universidade/admin/avaliacoes`** — hub admin criado (antes só existia `/resultados`).
4. **`learning-hub.tsx`** — link de avaliações conforme permissão (admin hub / meus resultados / catálogo).
5. **`relations-map.ts`** — relações `learning_assessment_*`, `assessments`, `course_enrollments.course_version_id`.
6. **`e2e/local-postgres-routes.spec.ts`** — smoke de 38 rotas principais.
7. **`playwright.config.ts`** + **`run-e2e-local-postgres.mjs`** — `PLAYWRIGHT_SKIP_WEBSERVER="1"` usa servidor já rodando; ausência ou outro valor permite servidor gerenciado pelo Playwright.

---

## Validação E2E de rotas (2026-07-06)

| Item | Resultado |
|------|-----------|
| Comando | `PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e:local-postgres:routes` |
| Servidor | Manual `next start --port 3099` |
| `/api/health` | OK — `auth_provider=local`, `database_provider=local_postgres`, `storage_driver=local` |
| Rotas | **38/38 passaram** (~34s, `--workers=1`) |
| Bug corrigido | `/universidade/admin/avaliacoes/resultados` — SQL usava `courses.title` (inexistente); corrigido para `course_versions.title` |
| E2E completo | **Não executado** nesta rodada |
| Visual | **Não executado** nesta rodada |

**Próximo passo após merge:** instalação no Windows Server (PostgreSQL nativo, NSSM, Caddy) e smoke manual no servidor.

## Tabela de rotas principais

| Módulo | Rota | Tipo | Parâmetros | Status | Observação |
|--------|------|------|------------|--------|------------|
| Público | `/login` | público | — | OK | |
| Público | `/esqueci-minha-senha` | público | — | OK | |
| Público | `/redefinir-senha` | público | `token` query | OK | |
| Público | `/validar-certificado` | público | `code`/`codigo` | OK | h1: Validar certificado |
| Público | `/acesso-negado` | público | — | OK | |
| Público | `/acesso-pendente` | auth | — | OK | |
| Shell | `/inicio` | autenticado | — | OK | |
| Shell | `/perfil` | autenticado | — | OK | |
| Shell | `/notificacoes` | autenticado | — | OK | |
| Admin | `/administracao` | admin | — | OK | |
| Admin | `/administracao/usuarios` | admin | — | OK | |
| Admin | `/administracao/usuarios/novo` | admin | — | OK | |
| Admin | `/administracao/usuarios/[userId]` | admin | `userId` UUID | OK | |
| Admin | `/administracao/grupos` | admin | — | OK | |
| Admin | `/administracao/grupos/[groupId]` | admin | `groupId` | OK | |
| Admin | `/administracao/permissoes` | admin | — | OK | |
| Admin | `/administracao/auditoria` | admin | filtros query | OK | |
| Admin | `/administracao/chamados/configuracoes` | admin | — | OK | |
| Chamados | `/chamados` | autenticado | `view` kanban/lista | OK | |
| Chamados | `/chamados/novo` | autenticado | — | OK | wizard |
| Chamados | `/chamados/[ticketId]` | autenticado | `ticketId` UUID | OK | |
| Chamados | `/chamados/protocolo/[protocol]` | autenticado | `protocol` | OK | |
| Conversa | `/conversa-de-norte` | autenticado | — | OK | |
| Conversa | `/conversa-de-norte/nova` | autenticado | — | OK | |
| Conversa | `/conversa-de-norte/[id]` | autenticado | `id` UUID | OK | |
| Conversa | `/conversa-de-norte/conversas` | autenticado | tab | OK | |
| Conversa | `/conversa-de-norte/check-in` | autenticado | — | OK | |
| Conversa | `/conversa-de-norte/planos-de-acao` | autenticado | — | OK | |
| Univ. | `/universidade` | autenticado | `tab` | OK | tabs: inicio, cursos, avaliacoes… |
| Univ. | `/universidade/avaliacoes` | redirect | — | OK | → `?tab=avaliacoes` |
| Univ. | `/universidade/catalogo` | autenticado | — | OK | |
| Univ. | `/universidade/catalogo/[cursoSlug]` | autenticado | `cursoSlug` | OK | |
| Univ. | `/universidade/minha-universidade` | autenticado | — | OK | |
| Univ. | `/universidade/trilhas` | autenticado | — | OK | |
| Univ. | `/universidade/equipe` | autenticado | — | OK | RBAC equipe |
| Univ. | `/universidade/admin` | admin | — | OK | redirect cursos |
| Univ. | `/universidade/admin/cursos` | admin | — | OK | |
| Univ. | `/universidade/admin/cursos/[courseId]` | admin | `courseId` | OK | |
| Univ. | `/universidade/admin/avaliacoes` | admin | — | **NOVO** | hub |
| Univ. | `/universidade/admin/avaliacoes/resultados` | RBAC | `period`, `course`, `status`… | **CORRIGIDO** | SQL local |
| Univ. | `/universidade/certificados` | autenticado | — | OK | |
| Univ. | `/universidade/curso/[cursoId]/aprender` | aluno | `cursoId` + enrollment | OK | player + avaliação |
| Gamif. | `/gamificacao` | autenticado | — | OK | |
| Gamif. | `/gamificacao/ranking` | autenticado | — | OK | |
| Gamif. | `/gamificacao/campanhas` | autenticado | — | OK | |
| News | `/news` | autenticado | — | OK | |
| News | `/news/nova` | editor | — | OK | |
| Relat. | `/relatorios` | autenticado | — | OK | |
| Relat. | `/relatorios/comercial` | autenticado | — | OK | |
| Relat. | `/relatorios/conversa-de-norte` | autenticado | — | OK | |
| Dashboards | `/dashboards` | autenticado | — | OK | |

---

## Universidade / Avaliações — detalhe

### Problema encontrado

`listAssessmentResults` usava embed PostgREST complexo com `profiles.team_id` e `teams` — colunas **inexistentes** em `profiles` no schema local. No path SQL local, a query inicial referenciava `courses.title`, mas **`courses` não possui `title`** — o título fica em **`course_versions.title`**. Causava erro 500 em `/universidade/admin/avaliacoes/resultados` (PostgreSQL `42703`).

### Solução

- Repositório SQL `listAssessmentResultsLocal` com joins corretos via `organization_memberships.team_id`.
- Hub `/universidade/admin/avaliacoes` para navegação admin.
- Tab Avaliações na universidade com links por permissão.

### Fluxos validados (código + E2E rotas)

| Fluxo | Status |
|-------|--------|
| Admin lista resultados | OK (pós-correção) |
| Filtros period/status | OK |
| RBAC view_own / view_team / view_all | OK (lógica TS) |
| Aluno — player avaliação | OK (actions + relations) |
| Certificado após aprovação | OK (massa QA) |

### Pendente no servidor

- Repetir smoke de avaliações com massa real do cliente.
- Validar Gerente vendo só equipe com dados reais.

---

## Riscos restantes

1. `has_permission()` SQL local sempre `false` — auth na camada TS.
2. Rotas dinâmicas com ID inválido podem mostrar empty state (não 500) — validar caso a caso no servidor.
3. `LocalQueryBuilder` não cobre 100% PostgREST — novos embeds exigem `relations-map` ou SQL explícito.
4. Smoke E2E de rotas depende de massa QA (`npm run qa:setup:local-postgres`).

---

## Comandos de validação

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:authz:local
npm run build
npm run production:check -- --strict
npm run assert:no-supabase-local
npm run test:e2e:local-postgres:routes   # 38/38 OK (2026-07-06)
# npm run test:e2e:local-postgres        # não repetido nesta auditoria
# npm run test:visual                    # não repetido nesta auditoria
```
