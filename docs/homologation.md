# Homologação — Etapa 3

## Ambientes

| Ambiente | Uso | Banco |
|----------|-----|-------|
| Local | Desenvolvimento | Supabase local ou projeto dev |
| Teste | RLS, E2E | Projeto Supabase exclusivo (`TEST_SUPABASE_*`) |
| Homologação | Validação pré-produção | Projeto Supabase dedicado |
| Produção | Vercel Production | Projeto Supabase produção |

## Checklist de homologação

### Sem credenciais (validado localmente)

- [x] `npm run typecheck`
- [x] `npm run lint` (0 warnings)
- [x] `npm run test` (20 testes unitários)
- [x] `npm run build`
- [x] Sanitização HTML com testes
- [x] Health check sem dados sensíveis
- [x] Service role isolada em `server-only`
- [x] Versionamento de curso (código + migration)

### Requer Supabase

- [x] `npx supabase db reset` em banco limpo
- [x] `npm run qa:setup:local` (dois tenants + usuários QA)
- [ ] `npm run db:types` após `supabase link`
- [ ] `npm run qa:setup:staging` em homologação cloud
- [x] `npm run test:rls` com JWT real (0 ignorados)
- [ ] `npm run test:rls:sql` (pgTAP local)
- [x] E2E por perfil (`npm run test:e2e`)

### Requer Vercel

- [ ] Deploy Production ou Preview protegido
- [ ] Auth callbacks configurados
- [ ] Variáveis `NEXT_PUBLIC_*` e `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Smoke test pós-deploy

## Migration `20250629120000`

O timestamp `20250629` foi herdado da sequência inicial do projeto (junho/2025 no nome do arquivo). A migration `20250629130000_etapa3_versioning_security.sql` mantém a ordenação. **Não renomear** migrations já aplicadas em ambiente remoto.

## Rollback

1. Reverter deploy na Vercel para deployment anterior
2. Migrations são forward-only — correções via nova migration
3. Backup do Supabase antes de homologação em produção

## Comandos Windows (PowerShell)

```powershell
# Variáveis de bootstrap
$env:NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@empresa.com"
$env:BOOTSTRAP_ADMIN_NAME="Administrador"
$env:BOOTSTRAP_ORGANIZATION_NAME="Empresa Demo"
$env:BOOTSTRAP_ORGANIZATION_SLUG="empresa-demo"
npm run bootstrap:admin

# Tipos do banco
npx supabase link --project-ref SEU_REF
npm run db:types

# Testes
npm run test:rls
npm run test:e2e
```
