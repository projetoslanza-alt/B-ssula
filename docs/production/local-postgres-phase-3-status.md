# Fase 3 — Status PostgreSQL local Windows

**Branch:** `main` (+ `fix/final-local-production-screen-audit`)  
**Última validação:** 2026-07-06  
**Ambiente:** PostgreSQL real em Docker (`bussola-pg-validation`, porta 5434) + Next.js `npm run start` porta 3099

> **Não** instalado no servidor Windows. **Não** é go-live publicado.

---

## Resumo

| Área | Status |
|------|--------|
| PostgreSQL local (migrations 13/13) | OK |
| Auth local + bootstrap admin | OK |
| Grupos de acesso (`production:local-access-groups`) | OK |
| Storage local (upload/download/segurança) | OK |
| Smoke manual 20 passos | OK (passo 7 = OBSERVAÇÃO) |
| Auditoria telas/rotas (Fase 4) | **38/38 rotas OK** — ver `final-screen-route-audit.md` |
| Universidade / Avaliações resultados | **Corrigido** (`course_versions.title`, não `courses.title`) |
| E2E completo (`test:e2e:local-postgres`) | **Não repetido** nesta auditoria |
| Visual (`test:visual`) | **Não repetido** nesta auditoria |
| Checks automatizados (pré-commit) | OK |
| Documentação runbook/checklist | OK |
| Deploy servidor Windows | **Pendente** — próximo passo após merge |

---

## Commits relevantes

| Commit | Descrição |
|--------|-----------|
| `2875dfa` | test: validate local postgres runtime and e2e |
| `8c43636` | docs: finalize local postgres smoke and production runbook |
| `2097c18` | chore: exclude local test artifacts from repository |
| *(esta branch)* | fix: audit local postgres routes and assessments |

---

## Smoke manual — resultado

Relatório: `.local/smoke-manual-report.json` (gitignored)

| # | Passo | Status |
|---|-------|--------|
| 1 | Login admin local | OK |
| 2 | Acessar início | OK |
| 3 | Administração | OK |
| 4 | Criar Gerente | OK |
| 5 | Criar SDR | OK |
| 6 | Criar Closer | OK |
| 7 | Alterar grupo/permissão | OBSERVAÇÃO — matriz acessível; submit exige motivo |
| 8 | Auditoria | OK |
| 9 | Chamados | OK |
| 10 | Wizard chamado | OK |
| 11 | Perguntas dinâmicas | OK |
| 12 | Anexo arquivo | OK |
| 13 | Detalhe chamado | OK |
| 14 | Kanban | OK |
| 15 | News | OK |
| 16 | Universidade | OK |
| 17 | Cursos admin | OK |
| 18 | Conversa de Norte | OK |
| 19 | Relatório | OK |
| 20 | Logout + rota protegida | OK |

### Storage explícito

| Check | Status |
|-------|--------|
| Sem login → 401 | OK |
| Path traversal bloqueado | OK |
| Arquivo fora de `/public` | OK |
| Arquivo em `STORAGE_LOCAL_PATH` | OK |
| Metadados `.meta.json` | OK |

---

## Correções durante a Fase 3

1. **`src/middleware.local.ts`** — rotas `/api/*` sem sessão retornam `401` JSON em vez de redirect para `/login` (bloqueava validação de storage).
2. **`e2e/smoke-manual-local-postgres.spec.ts`** — caminho de disco corrigido (`{tenant}/support-attachments/...`); download autorizado validado.

---

## Smoke E2E de rotas (auditoria 2026-07-06)

| Item | Resultado |
|------|-----------|
| `npm run test:e2e:local-postgres:routes` | **38/38** (~34s) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `"1"` = servidor manual; outro valor = gerenciado |
| `/api/health` | OK (`local` / `local_postgres` / `local`) |
| Bug `/universidade/admin/avaliacoes/resultados` | Corrigido — `course_versions.title` |
| `npm run test:e2e:local-postgres` | **Não repetido** |
| `npm run test:visual` | **Não repetido** |

---

## Checks automatizados (baseline + auditoria 2026-07-06)

| Comando | Resultado |
|---------|-----------|
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run test` | 86/86 |
| `npm run test:authz:local` | 7/7 |
| `npm run build` | OK |
| `npm run production:check -- --strict` | OK |
| `npm run assert:no-supabase-local` | OK |
| `npm run test:e2e:local-postgres:routes` | **38/38** (auditoria) |
| `npm run test:e2e:local-postgres` | 100 passed (baseline `2875dfa`; **não repetido** na auditoria) |
| `npm run test:visual` | 23 passed (baseline; **não repetido** na auditoria) |
| `npx playwright test e2e/smoke-manual-local-postgres.spec.ts` | 1 passed |

---

## Riscos restantes

1. `has_permission()` SQL local sempre `false` — auth na app TS.
2. RPCs dependentes de permissão SQL precisam handler TS.
3. Snapshots visuais gamificação usam massa QA local.
4. `production:local-access-groups` usa `PRODUCTION_TENANT_SLUG` do env.
5. LocalQueryBuilder não é PostgREST completo.
6. Vídeos grandes dependem de disco/backup local.
7. Smoke no servidor real (HTTPS, NSSM, Caddy) ainda não executado.

---

## Próximos passos

1. **Merge** da branch `fix/final-local-production-screen-audit` na `main`.
2. **Instalação** no servidor Windows (PostgreSQL nativo, NSSM, Caddy).
3. Repetir smoke manual 20 passos no servidor.
4. Repetir `test:e2e:local-postgres:routes` no servidor (opcional).
5. Agendar backups e testar restore.

---

## Veredito

**PRONTO PARA MERGE E INSTALAÇÃO NO SERVIDOR WINDOWS** — smoke de rotas 38/38, bug de avaliações corrigido, checks pré-commit OK; E2E completo e visual **não** repetidos nesta auditoria; pendente instalação e smoke no servidor real.
