# Matriz de testes RLS

## Pré-requisitos

1. Projeto Supabase de **teste** isolado
2. Migrations aplicadas (`npx supabase db reset`)
3. Dois tenants criados (A e B)
4. Usuários no Auth com senhas conhecidas

## Usuários de teste

| Papel | Tenant | Variáveis |
|-------|--------|-----------|
| Admin A | A | `TEST_ADMIN_A_EMAIL`, `TEST_ADMIN_A_PASSWORD` |
| Admin B | B | `TEST_ADMIN_B_EMAIL`, `TEST_ADMIN_B_PASSWORD` |
| Aluno A | A | `TEST_STUDENT_A_EMAIL`, `TEST_STUDENT_A_PASSWORD` |
| Aluno B | B | `TEST_STUDENT_B_EMAIL`, `TEST_STUDENT_B_PASSWORD` |

## Cursos de teste

| Curso | Tenant | Variável |
|-------|--------|----------|
| Privado A | A | `TEST_COURSE_A_ID` |
| Privado B | B | `TEST_COURSE_B_ID` |

Obtenha os IDs após criar os cursos no ambiente de teste.

## Cenários obrigatórios

### Administrador A

| Operação | Esperado |
|----------|----------|
| SELECT curso B por ID | Bloqueado / vazio |
| UPDATE curso B | Erro RLS |
| INSERT módulo em curso B | Erro |
| SELECT auditoria B | Bloqueado |

### Aluno A

| Operação | Esperado |
|----------|----------|
| SELECT rascunhos | Vazio |
| SELECT curso B publicado | Bloqueado |
| UPDATE progresso aluno B | Bloqueado |
| UPDATE curso | Bloqueado |

### Teste de path Storage

Tentar acessar path `tenantB/...` com usuário Tenant A — deve falhar na política Storage.

## Execução

```powershell
$env:TEST_SUPABASE_URL="https://..."
$env:TEST_SUPABASE_ANON_KEY="..."
$env:TEST_SUPABASE_SERVICE_ROLE_KEY="..."
$env:TEST_ADMIN_A_EMAIL="admin-a@test.local"
$env:TEST_ADMIN_A_PASSWORD="..."
$env:TEST_COURSE_B_ID="uuid-do-curso-b"
npm run test:rls
```

Testes SQL estruturais (pgTAP):

```powershell
npm run test:rls:sql
```

Código de saída diferente de zero indica falha.
