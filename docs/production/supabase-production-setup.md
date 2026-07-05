# Checklist Supabase — Produção

## 1. Criar projeto

- [ ] Criar projeto **Supabase Produção** (separado de homologação)
- [ ] Anotar **Project URL**
- [ ] Anotar **anon key**
- [ ] Anotar **service role key** (somente servidor)

## 2. Banco de dados

- [ ] Aplicar migrations: `npx supabase link --project-ref SEU_REF` → `npx supabase db push`
- [ ] Confirmar 28 migrations aplicadas
- [ ] Gerar tipos: `npm run db:types`
- [ ] **Não** executar `seed.dev.sql`
- [ ] **Não** rodar fixtures QA

## 3. Auth

Site URL e redirects (Authentication → URL Configuration):

| Campo | Valor |
|-------|-------|
| Site URL | `https://seudominio.com.br` |
| Redirect URLs | `https://seudominio.com.br/redefinir-senha` |
| | `https://seudominio.com.br/login` |
| | `https://seudominio.com.br/acesso-negado` |
| | `https://seudominio.com.br/acesso-pendente` |

- [ ] Configurar SMTP corporativo (recomendado)
- [ ] Testar e-mail de recuperação de senha

## 4. Storage

- [ ] Verificar buckets da migration `20250629000004_storage.sql`
- [ ] Validar políticas de acesso (RLS)
- [ ] Testar upload de anexo em chamado (após go-live)

## 5. Segurança

- [ ] Revisar políticas RLS (`npm run test:rls` contra projeto produção)
- [ ] Habilitar backups automáticos
- [ ] Service role **nunca** no frontend

## 6. Admin inicial

- [ ] Criar usuário no Auth Dashboard (e-mail + senha real)
- [ ] Executar `bootstrap-production-admin.ps1`
- [ ] Executar `production:access-groups`
- [ ] Testar login em `https://seudominio.com.br/login`

## 7. Validação pós-configuração

```powershell
# No servidor, com .env.production carregado
npm run production:check -- --strict
.\scripts\production\health-check.ps1 -Domain "https://seudominio.com.br"
```
