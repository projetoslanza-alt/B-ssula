# Modelo de Dados

Ver migrations em `supabase/migrations/`.

## Diagrama simplificado

```mermaid
erDiagram
  organizations ||--o{ organization_memberships : has
  profiles ||--o{ organization_memberships : belongs
  organizations ||--o{ courses : owns
  courses ||--o{ course_versions : versions
  course_versions ||--o{ course_modules : contains
  course_modules ||--o{ lessons : contains
  lessons ||--o{ lesson_contents : has
  courses ||--o{ course_enrollments : links
  profiles ||--o{ course_enrollments : participates
  course_enrollments ||--o{ lesson_progress : tracks
```

## Versionamento de cursos

- `courses`: identidade estável (slug, tenant)
- `course_versions`: conteúdo publicável versionado
- Edição de publicado → nova versão (fase 3)
- Vínculos apontam para versão iniciada

## Terminologia

| Interno (banco) | Interface |
|-----------------|-----------|
| `course_enrollments` | vínculo com o curso |
| enrollment_origin | origem da atribuição |

**Nunca** usar "matrícula" na interface.
