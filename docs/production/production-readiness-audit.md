# Auditoria de prontidão para produção — Bússola

Data de referência: julho/2026  
Arquitetura alvo: **Windows Server Azure** + **Supabase Produção** (sem PostgreSQL local)

## Stack confirmada

| Item | Versão / valor |
|------|----------------|
| Node.js | 20+ (LTS recomendado) |
| Next.js | 16.2.9 |
| React | 19.2.4 |
| TypeScript | 5.x |
| Supabase JS | 2.108.2 |
| Migrations | 28 arquivos em `supabase/migrations/` |

## Inventário técnico

| # | Item | Detalhe |
|---|------|---------|
| 1 | Node | `engines` implícito: Node 20+ |
| 2 | Next.js | 16.2.9 App Router |
| 3 | React | 19.2.4 |
| 4 | Build | `npm run build` → `next build` |
| 5 | Start | `npm run start` → `next start` (porta `PORT` ou 3000) |
| 6 | Testes | Vitest, Playwright, RLS (`test:rls`) |
| 7 | Variáveis obrigatórias | Ver `docs/production/env.production.example` |
| 8 | Supabase Auth | Login e-mail/senha, middleware, guards |
| 9 | Supabase Storage | Buckets `learning-videos`, anexos support |
| 10 | Service role | `src/lib/env.server.ts` (server-only) |
| 11 | Client Supabase | `src/lib/supabase/client.ts` (anon key) |
| 12 | Admin Supabase | Server actions + scripts com service role |
| 13 | RLS / auth.uid() | 28 migrations + `test:rls` |
| 14 | Buckets | Migration `20250629000004_storage.sql` |
| 15 | URLs assinadas | `SIGNED_URL_TTL_SECONDS` (default 3600) |
| 16 | Anexos | `/api/support/upload`, storage |
| 17 | Vídeos | `learning-videos` bucket, player com signed URL |
| 18 | PDF | `pdf-lib` (certificados) |
| 19 | Certificados | Emissão + `/validar-certificado` |
| 20 | Health check | `GET /api/health` |
| 21 | Scripts QA | `qa:setup:local`, `qa:setup:staging` — **bloqueados em produção** |
| 22 | Scripts staging | `staging:*` — **bloqueados em produção** |
| 23 | Seed | `seed.dev.sql` — **não executar em produção** |
| 24 | Fixtures | `provision-staging-fixtures` — **bloqueado** |
| 25 | Comandos perigosos | `qa:setup:*`, `staging:*`, `setup:local`, `seed.dev` |
| 26 | Homologação/demo | DemoBanner (não usado em rotas), textos QA em perfil/certificado |
| 27 | Gaps produção | UI criar org, convites, papéis UI, CD automatizado |

---

## Tabela de prontidão

| Item | Estado atual | Risco | Ação necessária | Bloqueia produção? |
|------|--------------|-------|-----------------|---------------------|
| Migrations versionadas | 28 migrations prontas | Baixo | `npx supabase db push` no projeto produção | Sim (antes do go-live) |
| Supabase Auth | Funcional | Médio | Configurar Site URL e redirects no painel | Sim |
| Supabase Storage | Funcional | Médio | Validar buckets e políticas pós-migration | Sim |
| RLS multi-tenant | Implementado + testes | Baixo | Rodar `test:rls` contra projeto produção | Sim |
| APP_ENV=production | Suportado em código | Baixo | Definir em `.env.production` no servidor | Sim |
| Deploy Windows | Documentado + script PS1 | Médio | Instalar Node, Caddy, NSSM na VM | Sim (instalação) |
| Bootstrap admin | Script idempotente | Baixo | Auth manual + `bootstrap-production-admin.ps1` | Sim |
| Grupos de acesso | `production:access-groups` criado | Baixo | Executar após bootstrap | Sim |
| Admin cria usuários | UI `/administracao/usuarios/novo` | Baixo | Validar com Master | Não |
| Matriz permissões | UI `/administracao/permissoes` | Baixo | Validar por módulo | Não |
| Criar empresa UI | Não existe | Médio | Usar `bootstrap-production-organization.ps1` | Não (workaround) |
| Scripts QA em prod | Bloqueados | Alto se ignorado | Nunca rodar `qa:setup:*` em produção | Sim (se violado) |
| seed.dev.sql | Existe só para dev | Alto | Não executar | Sim (se executado) |
| Menu placeholders | Ocultos em produção | Baixo | Nav filtrada por `APP_ENV` | Não |
| E2E produção | `test:e2e:production-smoke` | Baixo | Rodar pós go-live com confirmação | Não |
| Backup Supabase | Manual no painel | Alto | Habilitar backups antes do go-live | Sim |
| CI/CD deploy | Apenas CI qualidade | Baixo | Deploy manual via script Windows | Não |
| SMTP Auth | Supabase default | Médio | Configurar SMTP corporativo | Recomendado |
| Domínio HTTPS | Caddy/IIS documentado | Médio | Configurar certificado | Sim |

---

## Veredito desta etapa

**PRONTO PARA REVISÃO DO RUNBOOK DE PRODUÇÃO**

A base técnica, documentação, scripts e proteções estão preparadas. O deploy real no Windows Server Azure e a aplicação de migrations no Supabase Produção são etapas seguintes, executadas manualmente conforme runbook.
