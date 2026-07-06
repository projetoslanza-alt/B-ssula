# Checklist go-live — PostgreSQL local Windows

Legenda:

- **[V]** validado em ambiente local (PostgreSQL Docker + localhost) — Fase 3
- **[S]** só no servidor Windows real (pendente)
- **[!]** não pode ser pulado antes do go-live

---

## Servidor [S]

- [ ] Windows Server Azure ligado
- [ ] Node 20+, Git, PostgreSQL 16+, Caddy, NSSM
- [ ] Pastas `D:\Bussola\*` criadas
- [ ] Portas 80/443 abertas; 3000/5432 bloqueadas externamente

## PostgreSQL

- [V] Migrations locais 13/13 aplicáveis (`npm run db:migrate:local-prod`)
- [S] Banco `bussola_prod` criado no servidor
- [S] Usuários `bussola_admin`, `bussola_app`, `bussola_backup` com senhas fortes
- [V] Schema base + migrations locais sem Supabase
- [!] **Sem Supabase** configurado (`npm run assert:no-supabase-local`)

## Aplicação

- [V] `.env` com `AUTH_PROVIDER=local`, `DATABASE_PROVIDER=local_postgres`, `STORAGE_DRIVER=local`
- [V] Segredos `AUTH_SECRET`, `SESSION_SECRET`, `PASSWORD_PEPPER` definidos
- [V] `npm run build` OK
- [V] `npm run production:check -- --strict` OK
- [S] `npm ci` + build no servidor
- [S] Serviço BussolaApp (NSSM) + Caddy

## Admin

- [V] `npm run bootstrap:local-admin` (fluxo validado)
- [V] `npm run production:local-access-groups`
- [V] Login admin local OK
- [V] Criar usuário Gerente/SDR/Closer pela UI

## Storage local [!]

- [V] `STORAGE_LOCAL_PATH` configurado
- [V] Upload em Chamados (`POST /api/support/upload`)
- [V] Arquivo salvo em `{STORAGE_LOCAL_PATH}/{tenant}/{bucket}/...`
- [V] Arquivo **não** em `/public`
- [V] Download autorizado via `/api/files/local`
- [V] Acesso negado sem login (401)
- [V] Path traversal bloqueado
- [V] Metadados `.meta.json` lateral
- [S] Backup agendado de uploads no servidor

## Backup [S]

- [ ] `backup-local-postgres.ps1` agendado
- [ ] `backup-local-uploads.ps1` agendado
- [ ] Cópia externa da VM testada
- [ ] Restore testado em ambiente isolado

## Segurança

- [V] Supabase vars ausentes (`assert:no-supabase-local`)
- [V] Uploads não servidos como pasta pública
- [V] `.env` fora do Git
- [V] `/api/*` sem sessão retorna 401 JSON (não redirect HTML)
- [S] Firewall/NSG do servidor

## Smoke manual 20 passos [!]

- [V] 1–6 Login, início, admin, criar Gerente/SDR/Closer
- [V] 7 Matriz de permissões acessível (alteração real exige motivo — OBS)
- [V] 8–11 Auditoria, Chamados, wizard, perguntas dinâmicas
- [V] 12 Anexo com storage local
- [V] 13–14 Detalhe chamado, Kanban
- [V] 15 News
- [V] 16–17 Universidade / cursos admin
- [V] 18–19 Conversa de Norte + relatório
- [V] 20 Logout + rota protegida
- [S] Repetir smoke completo no servidor após NSSM/Caddy

## Testes automatizados [V]

- [V] `npm run typecheck`
- [V] `npm run lint`
- [V] `npm run test` (86/86)
- [V] `npm run test:authz:local` (7/7)
- [V] `npm run test:e2e:local-postgres` (100)
- [V] `npm run test:visual` (23)

## Funcional (módulos)

- [V] Chamados (wizard, anexo, kanban)
- [V] Conversa de Norte + relatório
- [V] Universidade (catálogo + admin cursos)
- [V] News
- [V] Administração (usuários, grupos, auditoria)
- [V] Gamificação (E2E + visual com massa QA)
- [S] Validar todos os módulos no servidor com domínio HTTPS real

## Antes do merge na main [!]

- [V] Smoke manual local aprovado
- [V] Storage local validado
- [V] Runbook atualizado
- [ ] PR revisado
- [ ] Smoke repetido no servidor (pós-tutorial de instalação)
