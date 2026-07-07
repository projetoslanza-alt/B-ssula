# Runbook — Produção local Windows + PostgreSQL

> **Arquitetura alvo:** tudo no Windows Server — Next.js, PostgreSQL, storage local, Caddy, NSSM.  
> **Sem Supabase** em produção local.

Este runbook reflete o que foi validado na **Fase 3** em ambiente de desenvolvimento (PostgreSQL real em Docker + `npm run start` em localhost). A instalação no servidor Windows ainda **não** foi executada.

---

## 1. Instalar software (servidor Windows)

1. Node.js 20 LTS
2. Git
3. PostgreSQL 16+ para Windows (validação local usou `postgres:16-alpine`)
4. Caddy + NSSM

## 2. Estrutura de pastas

```
D:\Bussola\app              # código (clone do repositório)
D:\Bussola\shared\uploads   # STORAGE_LOCAL_PATH — arquivos privados
D:\Bussola\shared\logs      # logs NSSM
D:\Bussola\backups          # pg_dump + cópia de uploads
```

## 3. PostgreSQL

### 3.1 Criar banco e roles

Como superuser `postgres`:

```powershell
psql -U postgres -f D:\Bussola\app\scripts\production\init-local-postgres.sql
```

Definir senhas fortes para:

| Role | Uso |
|------|-----|
| `bussola_admin` | migrations, bootstrap, `DIRECT_DATABASE_URL` |
| `bussola_app` | runtime da aplicação (`DATABASE_URL`) |
| `bussola_backup` | `pg_dump` agendado |

### 3.2 Aplicar migrations

```powershell
cd D:\Bussola\app
$env:DATABASE_URL="postgresql://bussola_admin:SENHA@localhost:5432/bussola_prod"
npm run db:migrate:local-prod
```

Resultado esperado: **13/13** migrations em `db/migrations/local/`.

### 3.3 Validação local (desenvolvimento — Docker)

Para repetir a validação sem instalar PostgreSQL no host:

```powershell
.\scripts\setup-local-validation-db.ps1
# Container: bussola-pg-validation, porta 5434, banco bussola_local_validation
```

---

## 4. Variáveis de ambiente

Copiar `docs/production/env.local-postgres.production.example` → `.env.production` no servidor.

**Obrigatórias:**

| Variável | Valor |
|----------|-------|
| `APP_ENV` | `production` |
| `NODE_ENV` | `production` |
| `AUTH_PROVIDER` | `local` |
| `NEXT_PUBLIC_AUTH_PROVIDER` | `local` |
| `DATABASE_PROVIDER` | `local_postgres` |
| `NEXT_PUBLIC_DATABASE_PROVIDER` | `local_postgres` |
| `STORAGE_DRIVER` | `local` |
| `NEXT_PUBLIC_STORAGE_DRIVER` | `local` |
| `DATABASE_URL` | PostgreSQL (`bussola_app`) |
| `DIRECT_DATABASE_URL` | PostgreSQL (`bussola_admin`) |
| `AUTH_SECRET` | ≥ 48 bytes |
| `SESSION_SECRET` | ≥ 48 bytes |
| `PASSWORD_PEPPER` | segredo de hash de senha |
| `STORAGE_LOCAL_PATH` | ex.: `D:\Bussola\shared\uploads` |
| `NEXT_PUBLIC_APP_URL` | URL pública HTTPS |

**Não definir:** `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`.

Validar:

```powershell
npm run production:check -- --strict
npm run assert:no-supabase-local
```

---

## 5. Bootstrap admin e grupos

```powershell
$env:PRODUCTION_CONFIRMATION="CRIAR_ADMIN_LOCAL_PRODUCAO"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@seudominio.com.br"
$env:BOOTSTRAP_ADMIN_NAME="Administrador"
$env:BOOTSTRAP_ADMIN_PASSWORD="SenhaForte12+"
$env:BOOTSTRAP_ORGANIZATION_NAME="Minha Empresa"
$env:BOOTSTRAP_ORGANIZATION_SLUG="minha-empresa"
$env:PRODUCTION_TENANT_SLUG="minha-empresa"
npm run bootstrap:local-admin
npm run production:local-access-groups
```

> `production:local-access-groups` provisiona grupos Master/Gerente/SDR/Closer no tenant definido em `PRODUCTION_TENANT_SLUG` — não nos tenants QA `empresa-norte`/`empresa-sul` automaticamente.

---

## 6. Build e start

```powershell
npm ci
npm run build
npm run start
# ou: node node_modules/next/dist/bin/next start -p 3000
```

### Smoke local (desenvolvimento)

```powershell
$env:PORT="3099"
$env:NEXT_PUBLIC_APP_URL="http://localhost:3099"
$env:STORAGE_LOCAL_PATH=".local/smoke-uploads"
npm run build
npm run start
```

Health check:

```powershell
Invoke-RestMethod http://localhost:3099/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "app": "bussola",
  "auth_provider": "local",
  "database_provider": "local_postgres",
  "storage_driver": "local",
  "environment": "production"
}
```

---

## 7. Caddy + NSSM (servidor)

Ver guia detalhado: `docs/production/caddy-nssm-windows.md`.

Resumo:

1. **BussolaApp** — `next start -p 3000`, logs em `D:\Bussola\shared\logs\`
2. **Caddy** — `reverse_proxy localhost:3000`, TLS automático
3. Portas **80/443** públicas; **3000** e **5432** apenas localhost

---

## 8. Backup e restore

```powershell
.\scripts\production\backup-local-postgres.ps1
.\scripts\production\backup-local-uploads.ps1
```

Restore PostgreSQL:

```powershell
.\scripts\production\restore-local-postgres.ps1 -DumpFile D:\Bussola\backups\pg-YYYYMMDD.dump
```

Copiar `D:\Bussola\backups` para storage externo regularmente. Vídeos e anexos grandes dependem de disco local e deste backup.

---

## 9. Storage local

### Layout no disco

```
STORAGE_LOCAL_PATH/
  {tenantId}/
    {bucket}/           # ex.: support-attachments, learning-covers
      {relativePath}    # ex.: intake/{userId}/{timestamp}-{file}
      {relativePath}.meta.json
```

Arquivos **não** ficam em `/public`. Download autorizado via `GET /api/files/local?ref={tenantId}/{bucket}/{path}`.

### Upload de chamados

- `POST /api/support/upload` (multipart, campo `file`)
- Permissão: `support.ticket.create`
- Tipos permitidos: imagens, PDF, texto, Office (ver `support-upload.ts`)
- Máximo: 20 MB por arquivo

### Segurança validada

| Cenário | Resultado esperado |
|---------|-------------------|
| Sem sessão em `/api/files/local` | **401** JSON |
| Path traversal (`../`) | **401** ou **400** |
| Download com sessão autorizada | **200** + bytes do arquivo |
| Arquivo em `/public` | **não** deve existir |

Metadados ficam em `.meta.json` lateral — **não** há tabelas `file_objects`/`file_links` no modo local atual.

---

## 10. Smoke manual — 20 passos

Script automatizado (registra relatório em `.local/smoke-manual-report.json`):

```powershell
$env:PLAYWRIGHT_SKIP_WEBSERVER="1"
npx playwright test e2e/smoke-manual-local-postgres.spec.ts --retries=0
```

Repetir manualmente no servidor após deploy. Passos:

| # | Passo | Validado local |
|---|-------|----------------|
| 1 | Login admin local | OK |
| 2 | Acessar início | OK |
| 3 | Administração | OK |
| 4 | Criar usuário Gerente | OK |
| 5 | Criar usuário SDR | OK |
| 6 | Criar usuário Closer | OK |
| 7 | Alterar grupo/permissão | OBS — matriz acessível; submit exige motivo |
| 8 | Auditoria da alteração | OK (listagem) |
| 9 | Abrir Chamados | OK |
| 10 | Criar chamado (wizard) | OK (parcial até perguntas dinâmicas) |
| 11 | Perguntas dinâmicas | OK |
| 12 | Anexar arquivo | OK (upload API + download) |
| 13 | Detalhe do chamado | OK |
| 14 | Mover card Kanban | OK |
| 15 | News (listagem/criação) | OK |
| 16 | Universidade | OK |
| 17 | Curso/certificado/material | OK (admin cursos) |
| 18 | Conversa de Norte | OK |
| 19 | Relatório Conversa de Norte | OK |
| 20 | Logout + rota protegida | OK |

Credenciais QA local (massa `empresa-norte`): `admin.norte@bussola.local` / ver fixtures em `scripts/qa-fixtures.ts`.

---

## 11. Riscos conhecidos

1. **`has_permission()` SQL** — na stack local sempre retorna `false`; autorização ocorre na camada TS (`requirePermission`, `getLocalSessionContext`).
2. **RPCs com permissão SQL** — devem ter implementação TS em `rpc-handlers.ts` (ex.: `create_course_draft_from_published`).
3. **Snapshots visuais de gamificação** — refletem massa QA local, não dados de produção.
4. **`production:local-access-groups`** — tenant controlado por `PRODUCTION_TENANT_SLUG`.
5. **LocalQueryBuilder** — não é PostgREST completo; cobre apenas fluxos usados pela aplicação.
6. **Vídeos grandes** — dependem de disco e backup de `STORAGE_LOCAL_PATH`.

---

## 12. Problemas comuns

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `production:check` falha | Supabase vars presentes | Remover vars Supabase; `assert:no-supabase-local` |
| Health `database_provider` errado | `DATABASE_PROVIDER` ausente | Definir `local_postgres` |
| Upload 403 | Sem `support.ticket.create` | Verificar papel/grupo do usuário |
| `/api/files/local` retorna HTML login | Middleware antigo | Rebuild; rotas `/api/*` sem sessão devem retornar **401** JSON |
| Arquivo não aparece no disco | Caminho errado | Disco: `{STORAGE_LOCAL_PATH}/{tenant}/{bucket}/{path}` |
| Permissões vazias no login | Sem roles nem grupos | `bootstrap:local-admin` + `production:local-access-groups` |
| Migrations falham | `DATABASE_URL` sem admin | Usar `bussola_admin` para migrate |

---

## 13. Checks automatizados (CI local)

```powershell
npm run typecheck
npm run lint
npm run test                    # 86 unit
npm run test:authz:local        # 7
npm run build
npm run production:check -- --strict
npm run assert:no-supabase-local
npm run test:e2e:local-postgres # 100
npm run test:visual             # 23
```
