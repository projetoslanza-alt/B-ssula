# Runbook — Deploy Windows Server Azure + Supabase

Guia completo para subir a Bússola em produção econômica.

## Arquitetura

```
Usuário → HTTPS (domínio) → Caddy/IIS → Next.js :3000 → Supabase Produção
                                              ├── PostgreSQL + RLS
                                              ├── Auth
                                              └── Storage
```

**No Windows Server:** apenas a aplicação Next.js.  
**No Supabase:** banco, auth, storage e políticas RLS.

## Estrutura de pastas no servidor

| Caminho | Uso |
|---------|-----|
| `D:\Bussola\app` | Código da aplicação (clone Git) |
| `D:\Bussola\shared` | Arquivos compartilhados |
| `D:\Bussola\shared\logs` | Logs de deploy e serviços |
| `D:\Bussola\scripts` | Cópia opcional de scripts auxiliares |
| `C:\Caddy` | Caddy + Caddyfile |

> Se não houver disco D:, use `C:\Bussola` (menos ideal, mas funcional).

---

## Fase 1 — Pré-requisitos Azure

Peça para quem tem acesso à Azure:

1. VM Windows Server ligada
2. IP público (ou Load Balancer) com DNS apontando para o domínio
3. NSG com portas **80** e **443** abertas para internet
4. Porta **3389** restrita a IPs autorizados
5. Porta **3000** fechada externamente

---

## Fase 2 — Instalar software no Windows

### Node.js 20 LTS

1. Baixe em https://nodejs.org/
2. Instale com opções padrão
3. Verifique: `node -v` e `npm -v`

### Git

1. Baixe em https://git-scm.com/download/win
2. Instale com opções padrão
3. Verifique: `git --version`

### Caddy

Ver `docs/production/caddy-nssm-windows.md`

### NSSM

Ver `docs/production/caddy-nssm-windows.md`

---

## Fase 3 — Supabase Produção

Siga `docs/production/supabase-production-setup.md`:

1. Criar projeto Supabase Produção
2. `npx supabase link --project-ref SEU_REF`
3. `npx supabase db push`
4. **Não** rodar `seed.dev.sql`
5. Configurar Auth URLs
6. Anotar URL, anon key e service role

---

## Fase 4 — Clonar e configurar aplicação

```powershell
New-Item -ItemType Directory -Path D:\Bussola\app -Force
New-Item -ItemType Directory -Path D:\Bussola\shared\logs -Force

cd D:\Bussola\app
git clone https://github.com/SEU_ORG/bussola.git .
git checkout main

# Criar .env.production (copiar de docs/production/env.production.example)
notepad .env.production
```

Preencha com valores reais do Supabase e domínio.

```powershell
npm ci
npm run production:check -- --strict
npm run build
npm run start
# Teste: http://localhost:3000/api/health
```

---

## Fase 5 — HTTPS com Caddy

1. Copie `docs/production/Caddyfile.example` → `C:\Caddy\Caddyfile`
2. Substitua o domínio
3. Teste: `cd C:\Caddy; .\caddy.exe run --config Caddyfile`
4. Instale como serviço (ver `caddy-nssm-windows.md`)

---

## Fase 6 — Serviço Windows (NSSM)

```powershell
nssm install BussolaApp "C:\Program Files\nodejs\node.exe"
nssm set BussolaApp AppDirectory "D:\Bussola\app"
nssm set BussolaApp AppParameters "node_modules\next\dist\bin\next start -p 3000"
nssm start BussolaApp
```

---

## Fase 7 — Admin inicial

### 7.1 Criar usuário no Supabase Auth

Painel Supabase → Authentication → Users → Add user

### 7.2 Bootstrap

```powershell
cd D:\Bussola\app
$env:APP_ENV="production"
$env:PRODUCTION_CONFIRMATION="CRIAR_ADMIN_PRODUCAO"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@empresa.com.br"
$env:BOOTSTRAP_ADMIN_NAME="Administrador"
$env:BOOTSTRAP_ORGANIZATION_NAME="Empresa Principal"
$env:BOOTSTRAP_ORGANIZATION_SLUG="empresa-principal"
# + NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

.\scripts\production\bootstrap-production-admin.ps1
```

### 7.3 Grupos de acesso

```powershell
$env:PRODUCTION_CONFIRMATION="PROVISIONAR_GRUPOS_PRODUCAO"
$env:PRODUCTION_TENANT_SLUG="empresa-principal"
npm run production:access-groups
```

### 7.4 Criar demais usuários

1. Login como admin
2. `/administracao/usuarios/novo`
3. Informar nome, e-mail, grupo e status
4. Ajustar permissões em `/administracao/permissoes`

---

## Fase 8 — Validação funcional

| Módulo | Rota | O que validar |
|--------|------|---------------|
| Health | `/api/health` | `environment: production` |
| Login/Logout | `/login` | Entrada e saída |
| Início | `/inicio` | Dashboard carrega |
| Administração | `/administracao` | Cards visíveis |
| Usuários | `/administracao/usuarios` | Lista e criação |
| Grupos | `/administracao/grupos` | Master, Gerente, SDR, Closer |
| Permissões | `/administracao/permissoes` | Matriz por módulo |
| Chamados | `/chamados`, `/chamados/novo` | Wizard e Kanban |
| Conversa de Norte | `/conversa-de-norte` | Wizard e check-in |
| Universidade | `/universidade` | Catálogo e admin cursos |
| Relatórios | `/relatorios` | Construtor |
| Rota protegida | `/inicio` após logout | Redireciona para login |

```powershell
.\scripts\production\health-check.ps1 -Domain "https://seudominio.com.br"
```

---

## Fase 9 — Atualizar produção (deploys futuros)

> **Rodar migrations antes do deploy** conforme `supabase-production-setup.md`.

```powershell
cd D:\Bussola\app
.\scripts\production\deploy-windows.ps1
```

O script executa: pull, `npm ci`, typecheck, lint, test, test:rls, build, restart BussolaApp, health check.

---

## Rollback

1. **Aplicação:** `git log` → checkout commit anterior → `npm ci` → `npm run build` → `nssm restart BussolaApp`
2. **Banco:** migrations são forward-only — correções via nova migration
3. **Backup:** restaurar snapshot Supabase se necessário

---

## Checklist final

Use `docs/production/go-live-checklist.md` e marque todos os itens.

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Health retorna `development` | Verificar `APP_ENV=production` no serviço NSSM |
| Login falha | Conferir Site URL no Supabase Auth |
| 502 no HTTPS | Verificar se BussolaApp está rodando na 3000 |
| `/acesso-pendente` | Admin sem permissões — rodar `production:access-groups` |
| Service role exposta | Nunca colocar em variáveis `NEXT_PUBLIC_*` |
