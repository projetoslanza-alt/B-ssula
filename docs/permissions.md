# Permissões

RBAC com papéis de sistema globais e permissões granulares.

## Papéis

| Código | Nome |
|--------|------|
| `student` | Aluno (todos autenticados) |
| `manager` | Gestor |
| `instructor` | Instrutor |
| `learning_admin` | Administrador da Universidade |
| `director` | Diretoria |
| `org_admin` | Administrador da organização |
| `platform_admin` | Administrador Bússola |

## Permissões principais

```
learning.catalog.read
learning.course.read
learning.course.start
learning.course.create
learning.course.publish
learning.assignment.create
learning.team.read
learning.reports.read
platform.users.manage
platform.global_content.manage
platform.audit.read
```

## Regras

- Frontend oculta ações não permitidas
- Server Actions e RLS sempre validam
- Gestor não altera progresso manualmente (exceto dispensa com permissão especial)
