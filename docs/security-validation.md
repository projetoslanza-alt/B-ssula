# Validação de segurança

## Service role — usos restantes

| Arquivo | Motivo | Operação | Sessão comum? | Service role necessária? |
|---------|--------|----------|---------------|--------------------------|
| `scripts/bootstrap-admin.ts` | Bootstrap inicial | Criar org, vínculo, papéis, contexto | Não | **Sim** — Auth admin + bypass RLS controlado |
| `src/lib/supabase/admin.ts` | Wrapper bootstrap/manutenção | Cliente admin | Não | **Sim** — apenas scripts server |
| `scripts/test-rls.ts` | Setup de teste (opcional) | Não usa service role para simular usuário | — | Não no fluxo de teste JWT |

**Removido de fluxos normais:** CRUD de cursos, progresso, catálogo, player, uploads, troca de tenant, publicação (usa RPC com JWT).

## Storage

| Bucket | Visibilidade | Entrega |
|--------|--------------|---------|
| `course-covers` | Privado | Signed URL após validação |
| `course-materials` | Privado | Signed URL via `/api/learning/files` |
| `course-videos` | Privado | Signed URL via `/api/learning/files` |
| `certificate-assets` | Privado | Futuro (certificados) |
| `avatars` | Privado por usuário | Política Storage |

Capas armazenam `cover_bucket` + `cover_path` — não URL assinada permanente.

## Sanitização

- Servidor: `structure-actions` ao gravar texto/descrição
- Player: `sanitizeHtml` antes de `dangerouslySetInnerHTML`
- Tags bloqueadas: `script`, `iframe`, handlers `on*`, `javascript:`

## Progresso

- Cliente envia apenas eventos: posição de vídeo, leitura, acesso a arquivo
- `recalculate_enrollment_progress` calcula percentual
- Trigger `enrollment_progress_protect` bloqueia manipulação direta de `progress_percentage` e `completed_at`

## Upload

- Path reconstruído no servidor (`tenantId/entityId/...`)
- Validação de tenant, curso, MIME, tamanho
- Limpeza de arquivo se operação falhar após upload

## Health check

Resposta pública sem status de banco, chaves ou stack:

```json
{
  "status": "ok",
  "app": "bussola",
  "module": "learning",
  "environment": "production",
  "timestamp": "..."
}
```
