# Checklist go-live — PostgreSQL local Windows

## Servidor

- [ ] Windows Server Azure ligado
- [ ] Node 20+, Git, PostgreSQL, Caddy, NSSM
- [ ] Pastas `D:\Bussola\*` criadas
- [ ] Portas 80/443 abertas; 3000/5432 bloqueadas externamente

## PostgreSQL

- [ ] Banco `bussola_prod` criado
- [ ] Usuários `bussola_admin`, `bussola_app`, `bussola_backup`
- [ ] Schema base aplicado
- [ ] `npm run db:migrate:local-prod` executado
- [ ] **Sem Supabase** configurado

## Aplicação

- [ ] `.env.production` com providers locais
- [ ] `AUTH_PROVIDER=local`
- [ ] `DATABASE_PROVIDER=local_postgres`
- [ ] `STORAGE_DRIVER=local`
- [ ] Segredos `AUTH_SECRET`, `SESSION_SECRET`, `PASSWORD_PEPPER`
- [ ] `npm ci` + `npm run build`
- [ ] Serviço BussolaApp + Caddy

## Admin

- [ ] `npm run bootstrap:local-admin`
- [ ] `npm run production:local-access-groups`
- [ ] Login admin OK
- [ ] Criar usuário pela UI (após Fase 2 migração)

## Backup

- [ ] `backup-local-postgres.ps1` agendado
- [ ] `backup-local-uploads.ps1` agendado
- [ ] Cópia externa da VM testada

## Segurança

- [ ] Supabase vars ausentes
- [ ] Uploads não servidos como pasta pública
- [ ] `.env` fora do Git

## Funcional (pós migração módulos)

- [ ] Chamados
- [ ] Conversa de Norte
- [ ] Universidade
- [ ] Gamificação
- [ ] News
- [ ] Relatórios
- [ ] Administração completa
