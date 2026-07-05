# Organizações (tenants) em produção

## Dois conceitos de “empresa”

| Conceito | Tabela | Escopo |
|----------|--------|--------|
| **Organização (tenant)** | `organizations` | Empresa cliente do SaaS B2B |
| **Empresa CRM** | `crm_companies` | Registro comercial dentro de um tenant |

Toda a plataforma isola dados por `tenant_id` via RLS.

## Primeira organização

Criada automaticamente pelo bootstrap do admin:

1. Criar usuário no Supabase Auth Dashboard
2. Executar `bootstrap-production-admin.ps1`
3. Executar `production:access-groups` com `PRODUCTION_TENANT_SLUG`

## Organização adicional

Não há UI para criar nova empresa. Use o script controlado:

```powershell
$env:APP_ENV="production"
$env:PRODUCTION_CONFIRMATION="CRIAR_ORGANIZACAO_PRODUCAO"
$env:PRODUCTION_ORGANIZATION_NAME="Cliente ABC"
$env:PRODUCTION_ORGANIZATION_SLUG="cliente-abc"
$env:PRODUCTION_ADMIN_EMAIL="admin@clienteabc.com.br"
.\scripts\production\bootstrap-production-organization.ps1
```

Depois provisione grupos:

```powershell
$env:PRODUCTION_CONFIRMATION="PROVISIONAR_GRUPOS_PRODUCAO"
$env:PRODUCTION_TENANT_SLUG="cliente-abc"
npm run production:access-groups
```

## Troca de tenant

Usuários com vínculo em múltiplas organizações usam o **organization-switcher** no topo da plataforma. Permissões são recalculadas no tenant ativo.

## Limitações atuais

- Sem painel `platform_admin` global
- Sem convite por e-mail (`organization_invites` existe no banco, sem UI)
- Sem edição de organização pela interface (`/administracao/organizacao` é placeholder)

## Riscos

- Criar org com slug duplicado: script é idempotente e reutiliza existente
- Org marcada `is_test_data=true`: scripts de produção abortam
- Service role: usar somente em scripts no servidor, nunca no browser

## Backlog futuro

- Painel global `platform_admin` para todas as organizações
- UI de criação/edição de organização
- Fluxo de convite por e-mail
