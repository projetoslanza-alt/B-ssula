# Versionamento de cursos

## Estados

| Status | Descrição |
|--------|-----------|
| `draft` | Rascunho editável |
| `in_review` | Em revisão (editável) |
| `published` | Versão vigente no catálogo |
| `superseded` | Substituída por versão mais nova |
| `suspended` | Suspensa |
| `archived` | Arquivada |

## Fluxo v1 → v2

1. **Publicar v1**: `current_version_id` aponta para v1 publicada
2. **Aluno A inicia curso**: vínculo em `course_enrollments` com `course_version_id = v1`
3. **Admin edita curso publicado**: `create_course_draft_from_published` cria v2 rascunho (cópia da estrutura)
4. **Admin edita v2**: alterações apenas no rascunho; v1 permanece publicada
5. **Publicar v2**: RPC `publish_course_version` marca v1 como `superseded`, v2 como `published`, atualiza `current_version_id`
6. **Aluno A**: continua em v1 (progresso preservado)
7. **Novo Aluno B**: inicia em v2 (`current_version_id`)

## Regras

- Apenas uma versão `published` por curso (índice único)
- Não duplicar rascunhos ao clicar editar (reutiliza rascunho existente)
- Curso publicado não é editado destrutivamente
- Publicação é transacional e idempotente contra clique duplo (lock em memória no servidor)

## Interface

- Banner ao editar curso publicado
- Aba **Versões** com histórico
- Botão **Criar nova versão**
- Checklist de publicação na versão rascunho

## RPCs

- `create_course_draft_from_published(p_course_id)` — idempotente
- `publish_course_version(p_course_id, p_version_id)` — transacional
