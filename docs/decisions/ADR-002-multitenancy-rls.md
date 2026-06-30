# ADR-002: Multi-tenancy com RLS

## Status
Aceito

## Contexto
Dados de organizações diferentes nunca podem se misturar.

## Decisão
- `tenant_id` em tabelas privadas
- Row Level Security obrigatória em todas as tabelas sensíveis
- Validação server-side além do RLS
- Conteúdo global com policies explícitas

## Consequências
- Segurança em profundidade
- Testes de isolamento necessários
- Queries sempre filtradas pelo contexto de sessão
