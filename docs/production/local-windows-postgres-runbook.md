# Runbook — Produção local Windows + PostgreSQL

> **Arquitetura alvo:** tudo no Windows Server — Next.js, PostgreSQL, storage local, Caddy, NSSM.  
> **Sem Supabase** em produção.

## 1. Instalar software

1. Node.js 20 LTS
2. Git
3. PostgreSQL 15+ para Windows
4. Caddy + NSSM

## 2. Estrutura de pastas

```
D:\Bussola\app              # código
D:\Bussola\shared\uploads   # arquivos
D:\Bussola\shared\logs      # logs
D:\Bussola\backups          # pg_dump + uploads
```

## 3. PostgreSQL

```powershell
# Como postgres superuser
psql -f D:\Bussola\app\scripts\production\init-local-postgres.sql
```

Criar senhas para `bussola_admin`, `bussola_app`, `bussola_backup`.

Aplicar schema base (migrations Supabase convertidas — ver audit) + migrations locais:

```powershell
cd D:\Bussola\app
npm run db:migrate:local-prod
```

## 4. Configurar `.env.production`

Copiar de `docs/production/env.local-postgres.production.example`.

Obrigatório:
- `AUTH_PROVIDER=local`
- `DATABASE_PROVIDER=local_postgres`
- `STORAGE_DRIVER=local`
- `DATABASE_URL`, `AUTH_SECRET`, `SESSION_SECRET`, `PASSWORD_PEPPER`

## 5. Bootstrap admin

```powershell
$env:PRODUCTION_CONFIRMATION="CRIAR_ADMIN_LOCAL_PRODUCAO"
# ... demais vars bootstrap
npm run bootstrap:local-admin
npm run production:local-access-groups
```

## 6. Build e serviço

```powershell
npm ci
npm run build
# NSSM BussolaApp → next start -p 3000
# Caddy → reverse_proxy localhost:3000
```

## 7. Backup

```powershell
.\scripts\production\backup-local-postgres.ps1
.\scripts\production\backup-local-uploads.ps1
```

Copiar `D:\Bussola\backups` para storage externo.

## 8. Smoke

- `/api/health` → `environment: production`
- Login admin local
- Administração → usuários → criar usuário
- Chamados, Universidade (após migração completa dos módulos)

## Pendência conhecida

Módulos de negócio ainda usam Supabase client — ver `local-postgres-migration-audit.md`.
