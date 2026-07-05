# Checklist de go-live — Bússola Produção

Marque cada item antes de considerar produção ativa.

## Supabase

- [ ] Projeto Supabase Produção criado
- [ ] Migrations aplicadas (28)
- [ ] `db:types` gerado
- [ ] `seed.dev` **não** executado
- [ ] Fixtures QA **não** executadas
- [ ] Auth URLs configuradas
- [ ] Storage validado
- [ ] RLS validado (`npm run test:rls`)
- [ ] Backup Supabase habilitado

## Windows Server

- [ ] VM ligada e acessível
- [ ] Node.js 20+ instalado
- [ ] Git instalado
- [ ] Caddy instalado (`C:\Caddy`)
- [ ] NSSM instalado
- [ ] `D:\Bussola` criado (ou `C:\Bussola` como alternativa)
- [ ] Repositório clonado em `D:\Bussola\app`
- [ ] `.env.production` criado (não versionado)
- [ ] `npm ci` executado
- [ ] `npm run build` executado
- [ ] `http://localhost:3000` funcionando
- [ ] Caddy funcionando
- [ ] HTTPS funcionando
- [ ] `BussolaApp` como serviço Windows
- [ ] `Caddy` como serviço Windows

## Segurança

- [ ] Porta 80 liberada (entrada web)
- [ ] Porta 443 liberada (HTTPS)
- [ ] Porta 3389 restrita (RDP)
- [ ] Porta 3000 **não** pública
- [ ] Porta 5432 **não** pública
- [ ] Service role fora do frontend
- [ ] `.env` fora do Git
- [ ] Usuários QA ausentes
- [ ] `APP_ENV=production`

## Admin inicial

- [ ] Usuário criado no Supabase Auth
- [ ] Bootstrap admin executado
- [ ] Grupos provisionados (`production:access-groups`)
- [ ] Login Master validado
- [ ] Criação de usuário validada (`/administracao/usuarios/novo`)
- [ ] Permissões por módulo validadas (`/administracao/permissoes`)

## Smoke funcional

- [ ] `/api/health` → `environment: production`
- [ ] Login
- [ ] `/inicio`
- [ ] `/administracao`
- [ ] `/administracao/usuarios`
- [ ] `/administracao/grupos`
- [ ] `/administracao/permissoes`
- [ ] `/chamados`
- [ ] `/chamados/novo`
- [ ] Kanban chamados
- [ ] `/conversa-de-norte`
- [ ] `/universidade`
- [ ] `/relatorios`
- [ ] `/news`
- [ ] `/gamificacao`
- [ ] `/notificacoes`
- [ ] `/perfil`
- [ ] Logout
- [ ] Rota protegida após logout
- [ ] Isolamento entre tenants (se múltiplas orgs)

## Pós go-live

- [ ] `npm run production:check -- --strict`
- [ ] `npm run test:e2e:production-smoke` (com confirmação)
- [ ] Registrar data/hora do go-live
- [ ] Documentar credenciais admin em cofre seguro
