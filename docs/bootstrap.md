# Bootstrap do primeiro administrador

Este fluxo configura de forma **idempotente** a primeira organização e o administrador inicial.

## Pré-requisitos

1. Projeto Supabase criado e migrations aplicadas (`npx supabase db push`)
2. Variáveis no ambiente (ou `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Passo 1 — Criar usuário no Supabase Auth

No painel Supabase: **Authentication → Users → Add user**

Informe o e-mail e senha do administrador inicial. **Não versione a senha.**

## Passo 2 — Executar bootstrap

### Bash

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@empresa.demo \
BOOTSTRAP_ADMIN_NAME="Administrador Demo" \
BOOTSTRAP_ORGANIZATION_NAME="Empresa Demo" \
BOOTSTRAP_ORGANIZATION_SLUG=empresa-demo \
npm run bootstrap:admin
```

### Windows PowerShell

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@empresa.com"
$env:BOOTSTRAP_ADMIN_NAME="Administrador"
$env:BOOTSTRAP_ORGANIZATION_NAME="Empresa Demo"
$env:BOOTSTRAP_ORGANIZATION_SLUG="empresa-demo"
npm run bootstrap:admin
```

Validações do script: e-mail válido, slug `a-z0-9-`, service role presente, idempotência em reexecuções.

O script irá:

1. Localizar o usuário pelo e-mail no Auth
2. Criar/atualizar perfil
3. Criar organização (se não existir)
4. Criar vínculo ativo
5. Atribuir papéis `student` e `org_admin`
6. Definir organização ativa
7. Registrar auditoria

## Passo 3 — Validar

1. Acesse `/login` com o e-mail e senha criados
2. Acesse `/universidade/admin/cursos`
3. Crie um curso de teste

## Promover outro administrador

Atribua o papel `org_admin` (`00000000-0000-0000-0000-000000000006`) em `membership_roles` para o vínculo do usuário.

## Revogar administrador

Remova a linha correspondente em `membership_roles` e registre auditoria manualmente.

## Recuperar acesso

Reexecute o bootstrap com o mesmo e-mail — o script é idempotente.
