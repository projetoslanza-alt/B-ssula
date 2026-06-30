# Deploy — Vercel + Supabase

## 1. Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar migrations: `npx supabase db push` (ou via SQL Editor)
3. Configurar Auth URLs:
   - Site URL: `https://seu-dominio.vercel.app`
   - Redirect: `https://seu-dominio.vercel.app/redefinir-senha`
4. Criar buckets (migration `20250629000004_storage.sql`)
5. **Não** executar `seed.dev.sql` em produção

## 2. Vercel

1. Conectar repositório
2. Framework: Next.js
3. Variáveis (Development, Preview, Production):

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENV=production
```

4. Deploy e validar `/api/health`

## 3. Primeiro administrador

1. Criar usuário via Supabase Auth Dashboard
2. Inserir membership e papel `org_admin` manualmente ou via script
3. Definir `user_organization_context`

## 4. Smoke tests pós-deploy

- Login e logout
- Acesso à Universidade
- Criação de curso (admin)
- Isolamento entre tenants (dois usuários de orgs diferentes)
