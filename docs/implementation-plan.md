# Plano de Implementação — Plataforma Bússola / Universidade

## Diagnóstico (Etapa 0)

| Item | Status |
|------|--------|
| Repositório | Inicializado do zero (jun/2026) |
| Stack | Next.js 16, React 19, TypeScript, Tailwind 4, Supabase |
| Risco principal | Credenciais Supabase não configuradas localmente |
| Decisão | Monólito modular com RLS obrigatório |

## Etapas

### Etapa 1 — Fundação ✅ (base)
- [x] Projeto Next.js com App Router
- [x] Validação de env com Zod
- [x] Clientes Supabase (browser, server, admin)
- [x] Middleware de autenticação
- [x] Migrations core (orgs, RBAC, auditoria, notificações)
- [x] Migrations learning (catálogo, cursos, progresso)
- [x] RLS policies
- [x] Storage buckets
- [x] Layout da plataforma
- [x] Páginas de login e recuperação de senha
- [x] `/api/health`

### Etapa 2 — Catálogo ✅ (base)
- [x] Listagem de catálogo com busca/filtros na URL
- [x] Detalhe do curso
- [x] Cards de curso
- [x] Home da Universidade
- [ ] Visibilidade granular completa (parcial — modelo pronto)

### Etapa 3 — Autoria 🔄 (parcial)
- [x] Criar curso em rascunho
- [x] Publicar com validação mínima
- [ ] Editor de módulos/aulas/conteúdos (UI)
- [ ] Upload de arquivos
- [ ] Versionamento com nova versão

### Etapa 4 — Aprendizagem 🔄 (parcial)
- [x] Iniciar curso (sem termo "matrícula" na UI)
- [x] Player com texto, vídeo, link, arquivo
- [x] Progresso e retomada de vídeo
- [x] Minha Universidade (base)
- [ ] Favoritos

### Etapa 5 — Gestão 🔄 (parcial)
- [x] Atribuição de curso (server action)
- [x] Notificações internas básicas
- [ ] Dashboard do gestor completo
- [ ] Relatórios administrativos

### Etapa 6 — Qualidade 🔄 (parcial)
- [x] Testes unitários (domínio)
- [x] Testes e2e smoke
- [x] CI GitHub Actions
- [ ] Testes de RLS automatizados
- [ ] Deploy Vercel validado

## Etapa atual (jun/2026) — Construtor e segurança ✅ parcial

- [x] RBAC real carregado do banco (sem fallback de aluno)
- [x] Bootstrap `npm run bootstrap:admin`
- [x] Troca de organização ativa
- [x] Páginas `/acesso-pendente` e `/acesso-negado`
- [x] Migration corretiva de segurança (`20250629120000_security_fixes.sql`)
- [x] Construtor: módulos, aulas, blocos de conteúdo, reordenação
- [x] Upload de capa, PDF, vídeo, imagem
- [x] Checklist de publicação
- [x] Prévia administrativa
- [x] Testes de publicação (unitários)
- [x] Testes SQL de estrutura RLS (`supabase/tests/rls_isolation_test.sql`)
- [ ] Testes RLS com JWT entre tenants (requer Supabase local)
- [ ] E2E fluxo completo admin→aluno (requer ambiente configurado)
- [ ] Visibilidade granular completa na UI
- [ ] Nova versão ao editar curso publicado
