# Critérios de aceite — Produção

## Obrigatório para produção inicial

| Critério | Status |
|----------|--------|
| Supabase produção separado de homologação | Preparado (execução manual) |
| 28 migrations aplicadas | Preparado |
| `APP_ENV=production` no servidor | Preparado |
| Domínio HTTPS (Caddy/IIS) | Documentado |
| `/api/health` retorna OK | Implementado |
| Primeiro admin real (Auth + bootstrap) | Documentado + scripts |
| Grupos Master/Gerente/SDR/Closer | `production:access-groups` |
| Admin cria usuários pela UI | Implementado |
| Permissões por módulo/grupo | Implementado |
| RLS multi-tenant | Implementado + `test:rls` |
| Smoke funcional pós-deploy | `test:e2e:production-smoke` |
| Backup Supabase | Checklist |
| Ausência de QA/demo/fixtures | Scripts bloqueados |
| Menu sem rotas placeholder | Filtro em produção |
| Scripts QA bloqueados em produção | Implementado |

## Recomendado para SaaS completa

| Critério | Status |
|----------|--------|
| Criação de empresa pela UI | Backlog |
| Convites por e-mail | Backlog |
| Painel global `platform_admin` | Backlog |
| Papéis pela UI (`/administracao/papeis`) | Backlog |
| CD automatizado (GitHub Actions → deploy) | Backlog |
| E2E no CI | Backlog |
| Migrations automatizadas no pipeline | Backlog |
| SMTP corporativo configurado | Recomendado no go-live |

## Backlog futuro (não bloqueia produção inicial controlada)

- CRM operacional (pipeline, contatos)
- Visibilidade granular de cursos na UI
- Versionamento automático ao editar curso publicado
- Automações, integrações, config org (placeholders)
- Migração para PostgreSQL local (se necessário no futuro)
- Remoção de Supabase Auth/Storage (não planejado nesta etapa)

## Veredito

A produção inicial controlada (um ou poucos clientes, admin manual, scripts documentados) **pode prosseguir** após execução do runbook no servidor e Supabase.
