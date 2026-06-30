# Usuários e massa de teste QA

Documentação dos usuários-padrão, tenants de homologação e mecanismos de provisionamento controlado.

## Ambientes

| Ambiente | E-mails | Senha | Recriação |
|----------|---------|-------|-----------|
| **Local** | `*@bussola.local` | `Bussola@123` (somente dev) | `npx supabase db reset` + `npm run qa:setup:local` |
| **Staging** | `*+qa@{QA_EMAIL_DOMAIN}` | Aleatória por usuário | Script idempotente com confirmação |
| **Produção** | Isolado no tenant QA | Aleatória, expira em 24–72h | Somente com flags + confirmação explícita |

**Nunca** use a senha local em staging ou produção.

## Tenants padrão

| Tenant | Slug | Fixture key |
|--------|------|-------------|
| Empresa Norte | `empresa-norte` | `tenant.north` |
| Empresa Sul | `empresa-sul` | `tenant.south` |
| QA Produção (controlado) | slug não previsível | `tenant.production.qa` |

## Perfis e papéis existentes

| Perfil conceitual | Role existente | Escopo | Permissões principais |
|-------------------|----------------|--------|------------------------|
| Administrador global Bússola | `platform_admin` | Global | Todas |
| Administrador da organização | `org_admin` | Tenant | `learning.*`, `platform.*` do tenant |
| Diretoria | `director` | Tenant | Relatórios, catálogo |
| Gestor | `manager` | Tenant/equipe | Equipe, atribuições, relatórios |
| Instrutor/produtor | `instructor` | Tenant | Criar/editar/publicar cursos próprios |
| Aluno | `student` | Tenant | Catálogo, progresso próprio |

## Usuários locais

Senha compartilhada **apenas em desenvolvimento**: `Bussola@123`

| E-mail | Perfil | Tenant |
|--------|--------|--------|
| `superadmin@bussola.local` | Administrador global | Norte (contexto) |
| `admin.norte@bussola.local` | Admin organização | Norte |
| `diretoria.norte@bussola.local` | Diretoria | Norte |
| `gestor.norte@bussola.local` | Gestor | Norte |
| `instrutor.norte@bussola.local` | Instrutor | Norte |
| `aluno.norte@bussola.local` | Aluno | Norte |
| `sempapel.norte@bussola.local` | Sem papel | Norte |
| `inativo.norte@bussola.local` | Inativo | Norte |
| `admin.sul@bussola.local` … | (mesmos perfis) | Sul |
| `multiempresa@bussola.local` | Gestor (Norte) + Aluno (Sul) | Multi |

## Comandos

```powershell
# Setup completo local (após db reset)
npm run qa:setup:local

# Reexecutar (idempotente)
npm run qa:setup:local

# Listar fixtures
npm run qa:users:list

# Homologação cloud (requer APP_ENV=staging e STAGING_QA_CONFIRMATION=PROVISIONAR_HOMOLOGACAO)
npm run qa:setup:staging

# Produção — somente mecanismo, nunca automático
npm run qa:users:production -- --confirm-production-qa

# Desativar / limpar contas de teste
npm run qa:users:disable
npm run qa:users:cleanup -- --environment=production --confirm-production-cleanup
```

## Credenciais staging

Geradas em `.local/qa-credentials.json` (ignorado pelo Git). O script informa apenas o caminho — **não imprime senhas no terminal**.

## Marcadores de teste

Colunas em `profiles`, `organizations` e `courses`:

- `fixture_key` — chave estável
- `is_test_account` / `is_test_data`
- `test_environment`
- `test_expires_at` (produção)

## Testes

```powershell
npm run test:rls    # JWT real, 0 ignorados
npm run test:e2e    # Fluxos por perfil
```

## Riscos e auditoria

- Service role usada **somente** no script de provisionamento (terminal)
- Contas QA não devem entrar em indicadores reais (`is_test_account = true`)
- Produção exige: `APP_ENV=production`, `ALLOW_PRODUCTION_TEST_USERS=true`, `PRODUCTION_QA_CONFIRMATION=CRIAR_CONTAS_QA_ISOLADAS`, `QA_EMAIL_DOMAIN`, `--confirm-production-qa`
- Não há superadmin genérico em produção
- Evento `QA_PROVISION` registrado em `audit_events`
