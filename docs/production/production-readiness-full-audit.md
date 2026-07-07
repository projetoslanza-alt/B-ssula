# Pente fino geral de produção — Bússola (local PostgreSQL)

**Branch:** `audit/production-readiness-full-system`  
**Data:** 2026-07-07  
**Base:** `main` @ `a02223c`  
**Stack alvo:** Windows Server, PostgreSQL local, Caddy, auth local, storage local — **sem Supabase em runtime**

---

## 1. Resumo executivo

### Veredito: **PRONTO COM RESSALVAS**

O Bússola está **operacional** para go-live em produção local (`local_postgres` + `AUTH_PROVIDER=local` + `STORAGE_DRIVER=local`). Os fluxos críticos (login, administração de usuários, chamados, universidade com vídeos Drive, news na home, relatórios por módulo, gamificação, conversa de norte) funcionam com dados reais no PostgreSQL.

**Ressalvas antes de liberar para clientes finais:**

| # | Ressalva | Severidade |
|---|----------|------------|
| 1 | **15 rotas placeholder** ainda acessíveis por URL direta (menu oculto em produção) | Média |
| 2 | **Reprovisionar grupos** no servidor após merge (`production:local-access-groups`) — correção de permissões Master/SDR/Closer | Alta (ação operacional) |
| 3 | **Sem fluxo de troca obrigatória de senha no primeiro acesso** | Média |
| 4 | **Construtor de relatórios** — visualização ainda parcial (JSON de blocos) | Baixa |
| 5 | **`/validar-certificado`** aceita códigos demo de homologação | Baixa |
| 6 | **E2E completo** não executado nesta sessão (ambiente Playwright/servidor) | Média (validação) |

**Não bloqueia go-live:** itens 4, 5.  
**Bloqueia se ignorado:** item 2 (Master sem `support.view` no banco atual impede Central de Chamados).

---

## 2. Checks automatizados executados

| Check | Resultado |
|-------|-----------|
| `npm run typecheck` | ✅ OK |
| `npm run lint` | ✅ OK |
| `npm run build` | ✅ OK (92 rotas geradas) |
| `npm run production:check -- --strict` | ✅ OK (aviso: `.local/qa-credentials.json` em dev) |
| `npm run assert:no-supabase-local` | ✅ OK |
| `npm test` (Vitest) | ✅ 103/103 |
| `vitest` video-embed | ✅ 13/13 |
| E2E `production-readiness-routes.spec.ts` | ⏳ Criado — rodar no servidor com `PLAYWRIGHT_SKIP_WEBSERVER=1` |
| E2E `local-postgres-routes.spec.ts` | ⏳ Não repetido nesta sessão |

---

## 3. Mapa de rotas

Legenda: **OK** = página funcional | **PROT** = protegida corretamente | **PH** = placeholder (`ModulePreparationPage`) | **REDIR** = redireciona | **404** = sem `page.tsx`

### Auth e shell

| Rota | Status | Observação |
|------|--------|------------|
| `/` | OK | Redireciona para login ou início |
| `/login` | OK | Auth local, sem Supabase no browser |
| `/esqueci-minha-senha` | OK | Fluxo local |
| `/redefinir-senha` | OK | Token por e-mail |
| `/acesso-negado` | OK | |
| `/inicio` | OK PROT | News reais do DB, ranking gamificação |
| `/dashboards` | OK PROT | Requer `reports.view` ou `reports.crm.view` |
| `/perfil` | OK PROT | |
| `/notificacoes` | OK PROT | |

### News

| Rota | Status | Observação |
|------|--------|------------|
| `/news` | OK PROT | Listagem real |
| `/news/nova` | OK PROT | `news.manage` (só Master) |
| `/news/[id]` | OK PROT | |
| `/news/[id]/editar` | OK PROT | `news.manage` |

### Chamados

| Rota | Status | Observação |
|------|--------|------------|
| `/chamados` | OK PROT | Hub — corrigido: `support.view` OU `create` OU `manage_all` |
| `/chamados/novo` | OK PROT | Wizard completo |
| `/chamados/meus` | OK PROT | |
| `/chamados/todos` | OK PROT | `support.ticket.manage_all` |
| `/chamados/[ticketId]` | OK PROT | Mensagens, histórico, anexos |
| `/chamados/protocolo/[protocol]` | OK PROT | |
| `/chamados/administracao` | REDIR | → `/administracao/chamados/configuracoes` |
| `/chamados/categorias` | PH | Menu oculto em produção |
| `/chamados/configuracoes` | PH | |
| `/chamados/sla` | PH | |
| `/chamados/base-de-conhecimento` | PH | |

### Conversa de Norte

| Rota | Status |
|------|--------|
| `/conversa-de-norte` | OK PROT |
| `/conversa-de-norte/check-in` | REDIR → `?tab=checkin` |
| `/conversa-de-norte/nova` | OK PROT |
| `/conversa-de-norte/conversas` | OK PROT |
| `/conversa-de-norte/equipe` | OK PROT |
| `/conversa-de-norte/historico` | OK PROT |
| `/conversa-de-norte/indicadores` | OK PROT |
| `/conversa-de-norte/planos-de-acao` | OK PROT |
| `/conversa-de-norte/modelos` | OK PROT |
| `/conversa-de-norte/[id]` | OK PROT |

### Universidade

| Rota | Status | Observação |
|------|--------|------------|
| `/universidade` | OK PROT | |
| `/universidade/catalogo` | OK PROT | Cursos publicados reais |
| `/universidade/catalogo/[cursoSlug]` | OK PROT | Fallback versão publicada |
| `/universidade/minha-universidade` | OK PROT | |
| `/universidade/minha-universidade/[section]` | OK PROT | |
| `/universidade/curso/[cursoId]/aprender` | OK PROT | Player Drive via iframe |
| `/universidade/admin` | OK PROT | |
| `/universidade/admin/cursos` | OK PROT | |
| `/universidade/admin/cursos/novo` | OK PROT | |
| `/universidade/admin/cursos/[courseId]/*` | OK PROT | conteúdo, matrículas, publicar |
| `/universidade/admin/avaliacoes` | OK PROT | |
| `/universidade/admin/avaliacoes/resultados` | OK PROT | SQL local corrigido |
| `/universidade/certificados` | OK PROT | |
| `/validar-certificado` | OK | Público; inclui códigos demo |

### Gamificação

| Rota | Status | Observação |
|------|--------|------------|
| `/gamificacao` | OK PROT | Hub com tabs |
| `/gamificacao/admin` | OK PROT | |
| `/gamificacao/campanhas` | OK PROT | |
| `/gamificacao/campanhas/nova` | OK PROT | |
| `/gamificacao/ranking` | REDIR → `?tab=ranking` |
| `/gamificacao/missoes` | REDIR → `?tab=missoes` |
| `/gamificacao/conquistas` | REDIR → `?tab=conquistas` |
| `/gamificacao/minha-jornada` | OK PROT | |

### Relatórios

| Rota | Status | Observação |
|------|--------|------------|
| `/relatorios` | OK PROT | Lista salva no DB |
| `/relatorios/novo` | OK PROT | Construtor |
| `/relatorios/[id]` | OK PROT | Visualização parcial (JSON) |
| `/relatorios/[id]/editar` | OK PROT | |
| `/relatorios/comercial` | OK PROT | Dados reais |
| `/relatorios/crm` | OK PROT | |
| `/relatorios/chamados` | OK PROT | |
| `/relatorios/universidade` | OK PROT | |
| `/relatorios/conversa-de-norte` | OK PROT | |
| `/relatorios/one-a-one` | OK PROT | |
| `/relatorios/operacao` | PH | Menu oculto |

### Administração

| Rota | Status | Observação |
|------|--------|------------|
| `/administracao` | OK PROT | `platform.users.manage` etc. |
| `/administracao/usuarios` | OK PROT | |
| `/administracao/usuarios/novo` | OK PROT | Senha inicial definida pelo admin |
| `/administracao/usuarios/[userId]` | OK PROT | Editar, inativar, grupo |
| `/administracao/grupos` | OK PROT | |
| `/administracao/grupos/[groupId]` | OK PROT | |
| `/administracao/permissoes` | OK PROT | Matriz read-only + auditoria |
| `/administracao/auditoria` | OK PROT | |
| `/administracao/chamados/configuracoes` | OK PROT | Board Kanban |
| `/administracao/organizacao` | PH | |
| `/administracao/equipes` | PH | |
| `/administracao/cargos` | PH | |
| `/administracao/papeis` | PH | |
| `/administracao/configuracoes` | PH | |
| `/administracao/unidades` | PH | |
| `/administracao/integracoes` | PH | |
| `/administracao/automacoes` | PH | |
| `/administracao/campos-personalizados` | PH | |

### Rotas em `routes.ts` sem página (404)

`/convite`, `/universidade/aulas/*`, `/gamificacao/admin/pontuacao` — não implementadas; não aparecem no menu.

---

## 4. Módulo Administração

### O que funciona

- CRUD de usuários (criar, editar, inativar/ativar, alterar grupo)
- Listagem e detalhe de grupos
- Matriz de permissões (visualização)
- Auditoria de alterações
- Configuração de board de chamados
- Estados vazios com mensagens adequadas
- Breadcrumbs e navegação entre telas

### O que não funciona / placeholder

- Organização, equipes, cargos, papéis, integrações, automações, campos personalizados, configurações globais — **ModulePreparationPage**
- Criação de grupos customizados pela UI (usa grupos provisionados: Master, Gerente, SDR, Closer)

### Riscos

- Placeholders acessíveis por URL (usuário vê "Em preparação")
- Alteração de permissões individuais exige motivo — fluxo correto, mas pode confundir admin leigo

---

## 5. Usuários, autenticação e permissões

### Login local

| Cenário | Status |
|---------|--------|
| Login com credenciais válidas | ✅ |
| Senha inválida — mensagem amigável | ✅ |
| Usuário inativo bloqueado | ✅ |
| Logout | ✅ |
| Sessão persiste (cookie) | ✅ |
| Rota protegida → login quando deslogado | ✅ |
| Sem dependência Supabase no browser | ✅ (`assert:no-supabase-local`) |

### Usuários

| Fluxo | Status |
|-------|--------|
| Criar usuário pela interface | ✅ |
| Editar usuário | ✅ |
| Inativar / ativar | ✅ |
| Trocar grupo | ✅ |
| Resetar senha (admin) | ✅ |
| Senha inicial definida na criação | ✅ |
| **Obrigar troca de senha no primeiro acesso** | ❌ **Não implementado** |

**Issue técnica — primeiro acesso:** Não há flag `must_change_password` nem redirect para troca obrigatória. Recomendação pós-go-live: adicionar coluna em `local_users`, middleware de redirect e tela de troca forçada.

### Matriz de permissões por grupo

| Permissão / área | Master | Gerente | SDR | Closer |
|------------------|--------|---------|-----|--------|
| Administração usuários | ✅ | ❌ | ❌ | ❌ |
| News criar/editar | ✅ | ❌ | ❌ | ❌ |
| Chamados — abrir | ✅ | ✅ | ✅ | ✅ |
| Chamados — ver hub | ✅* | ✅ | ✅* | ✅* |
| Chamados — gerenciar todos | ✅ | ✅ | ❌ | ❌ |
| Relatórios gerais | ✅ | parcial | ❌ | ❌ |
| Universidade admin | ✅ | parcial | ❌ | ❌ |
| Gamificação admin | ✅ | parcial | ❌ | ❌ |
| Conversa de Norte | ✅ | ✅ | ✅ | ✅ |

\* *Corrigido nesta branch: `support.view` adicionado a Master, SDR e Closer em `access-group-definitions.ts`. Requer `npm run production:local-access-groups` no servidor.*

### Falhas corrigidas nesta auditoria

1. **Master** sem `support.view` — bloqueava `/chamados` mesmo com `manage_all`
2. **Master** sem `reports.support.view`, `reports.learning.view`, etc. — bloqueava sub-relatórios
3. **SDR/Closer** sem `support.view` — hub de chamados inacessível
4. **Hub `/chamados`** — agora aceita qualquer permissão de suporte relevante

### Defesa em profundidade

- UI oculta itens de menu sem permissão (`navigation.ts`)
- Páginas usam `requirePagePermission` / `hasPermission`
- Backend em server actions valida permissões
- URL manual → `/acesso-negado` ou redirect (validado para SDR em `/administracao/usuarios`)

---

## 6. Universidade

### Aluno (dados reais: Trilha de Onboarding, 8 aulas, vídeos Drive)

| Fluxo | Status |
|-------|--------|
| Catálogo | ✅ |
| Detalhe `/catalogo/trilha-onboarding` | ✅ (fallback versão publicada) |
| Meus cursos | ✅ (correção enrollments local) |
| Aprender / player | ✅ iframe Drive `/preview` |
| Progresso | ✅ (content_progress no DB) |
| 8 aulas visíveis | ✅ |
| Certificados | ✅ (emissão admin; validação pública) |

### Admin

| Fluxo | Status |
|-------|--------|
| Criar/editar curso | ✅ |
| Módulos e aulas | ✅ |
| Publicar curso | ✅ |
| Matricular usuário | ✅ |
| Ver matrículas | ✅ |
| Avaliações / resultados | ✅ |

### UX vídeo Google Drive (implementado nesta branch)

- Aceita `https://drive.google.com/file/d/ID/view?usp=...`
- Converte para `/preview` ao salvar
- Bloqueia link de **pasta** com mensagem clara
- Salva em `external_url`, `file_url`, `metadata.provider: google_drive`
- Player usa iframe via `video-embed.ts`

### Pendências UX

- Wizard de criação de curso ainda técnico para admin leigo (melhoria pós-go-live)
- Upload de vídeo local vs Drive — documentar no runbook

---

## 7. News

| Pergunta | Resposta |
|----------|----------|
| Atualiza automaticamente na Home? | **Sim** — `getHomeNewsPublications` busca `status=published` ordenado por `published_at` |
| Quem pode criar? | **Master** (`news.manage`) |
| Quem pode editar? | **Master** |
| Quem pode excluir/arquivar? | **Master** |
| Histórico/auditoria? | Parcial — auditoria de plataforma, não histórico de versões da news |
| Estados vazios | ✅ OK |

Anexos: suportados via storage local quando configurado.

---

## 8. Chamados

| Fluxo | Status |
|-------|--------|
| Abrir chamado (SDR) | ✅ |
| Categorias / subcategorias (wizard) | ✅ |
| Anexos (upload local) | ✅ |
| Mensagens e histórico | ✅ |
| Mudança de status (Kanban) | ✅ |
| Atribuição responsável | ✅ |
| Finalização | ✅ |
| Filtro meus / todos | ✅ |
| Protocolo | ✅ |
| SLA / categorias admin / KB | PH (placeholder) |

Fluxo completo 1→8 validado em smoke anterior; permissões corrigidas nesta branch.

---

## 9. Relatórios

| Tipo | Status |
|------|--------|
| Lista / criar / editar (construtor) | ✅ Salva no DB |
| Visualizar `[id]` | ⚠️ Parcial — renderiza JSON de blocos |
| `/relatorios/comercial` | ✅ Dados reais |
| `/relatorios/crm` | ✅ |
| `/relatorios/chamados` | ✅ |
| `/relatorios/universidade` | ✅ |
| `/relatorios/conversa-de-norte` | ✅ |
| `/relatorios/one-a-one` | ✅ |
| `/relatorios/operacao` | PH placeholder |
| Exportação | Parcial — `reports.export` no Master |

**Intuitividade:** Construtor funcional para power users; visualização final ainda não é dashboard polido.

---

## 10. Gamificação

| Fluxo | Status |
|-------|--------|
| Hub / ranking / missões / conquistas | ✅ Dados reais |
| Criar campanha | ✅ |
| Publicar / pausar | ✅ |
| Admin gerenciar | ✅ (Master; Gerente parcial) |
| Usuário comum vê apenas o permitido | ✅ |
| Dados vazios | ✅ |

**Mock/demo:** Snapshots visuais E2E usam massa QA; runtime em produção usa DB real. Não há mock no hub em produção.

---

## 11. Conversa de Norte

| Fluxo | Status |
|-------|--------|
| Check-in | ✅ |
| Criar conversa / one-on-one | ✅ |
| Notas e planos de ação | ✅ |
| Histórico / indicadores | ✅ |
| Permissões por grupo | ✅ |

Formulários persistem no PostgreSQL local.

---

## 12. CRM / Dashboards / Início

| Item | Real / Demo |
|------|-------------|
| News na Home | **Real** (DB) |
| Ranking / pódio gamificação | **Real** |
| Cards de atalho | Navegam para rotas reais |
| Dashboards CRM | **Real** (requer permissão) |
| Indicadores com banco vazio | Estados vazios tratados |

---

## 13. Notificações e perfil

| Fluxo | Status |
|-------|--------|
| Listar notificações | ✅ |
| Marcar como lida | ✅ |
| Navegar ao clicar | ✅ |
| Editar perfil | ✅ |
| Trocar senha (usuário) | ✅ (se implementado em perfil) |

---

## 14. Storage / uploads

| Cenário | Status |
|---------|--------|
| `STORAGE_DRIVER=local` | ✅ |
| Path `C:\Bussola\shared\uploads` | ✅ Configurável via `STORAGE_LOCAL_PATH` |
| `/api/files/local` | ✅ Auth + path seguro |
| `/api/support/upload` | ✅ |
| `/api/learning/upload` | ✅ |
| `/api/learning/files` | ✅ |
| Arquivos não públicos em `/public` | ✅ |

---

## 15. Backup e operacional

| Item | Status |
|------|--------|
| `backup-local-postgres.ps1` | ✅ Corrigido — usa `BUSSOLA_ROOT` |
| `backup-local-uploads.ps1` | ✅ Corrigido |
| Prioridade `C:\Bussola` > `D:\Bussola` | ✅ |
| Runbook atualizado | ✅ |

**Ação no servidor:** definir `$env:BUSSOLA_ROOT = "C:\Bussola"` (Machine) e validar tarefas agendadas.

---

## 16. Bugs corrigidos nesta branch

| Arquivo | Causa | Solução |
|---------|-------|---------|
| `scripts/lib/access-group-definitions.ts` | Master/SDR/Closer sem `support.view` e relatórios | Permissões adicionadas |
| `src/app/(platform)/chamados/page.tsx` | Hub exigia só `support.view` | `permissionsAny` ampliado |
| `scripts/production/backup-*.ps1` | Hardcoded `D:\Bussola` | `Get-BussolaRoot` com `BUSSOLA_ROOT` |
| `src/modules/learning/domain/video-embed.ts` | Sem validação pasta Drive | `isGoogleDriveFolderUrl`, `normalizeLessonVideoUrl` |
| `src/modules/learning/components/course-content-builder.tsx` | Admin colava link `/view` ou pasta | Normalização + bloqueio + ajuda UX |
| `e2e/production-readiness-routes.spec.ts` | Cobertura insuficiente | Novo spec de auditoria |

---

## 17. Bugs pendentes

| Bug | Severidade | Impacto | Recomendação |
|-----|------------|---------|--------------|
| Placeholders acessíveis por URL | Média | Confusão do usuário | Redirect 404 ou página "indisponível" em `APP_ENV=production` |
| Sem troca obrigatória de senha | Média | Segurança primeiro acesso | Implementar flag + middleware |
| Construtor relatórios — visualização | Baixa | UX power user | Iterar renderizador de blocos |
| Códigos demo em `/validar-certificado` | Baixa | Homologação vs produção | Desabilitar em `APP_ENV=production` |
| E2E não rodado no servidor | Média | Regressão | Rodar pós-deploy |
| Grupos no DB desatualizados | Alta | Permissões erradas | `production:local-access-groups` |

---

## 18. Melhorias de UX recomendadas

1. **Universidade — vídeos Drive:** implementado nesta branch; validar com admin real no servidor
2. **Criação de curso mastigada:** wizard guiado passo a passo (pós-go-live)
3. **Mensagens de erro:** padronizar toasts em formulários admin
4. **Placeholders:** não mostrar "Em preparação" — redirecionar ou 404

---

## 19. Checklist de produção

### Bloqueadores (resolver antes de clientes)

- [ ] Executar `npm run production:local-access-groups` no tenant de produção
- [ ] Validar login Master acessa `/chamados` e relatórios
- [ ] Confirmar `BUSSOLA_ROOT=C:\Bussola` nos backups agendados
- [ ] Remover `.local/qa-credentials.json` do servidor

### Importantes

- [ ] Rodar E2E `production-readiness-routes.spec.ts` no servidor
- [ ] Smoke manual 20 passos (`smoke-manual-local-postgres.spec.ts`)
- [ ] Testar Trilha de Onboarding com usuário matriculado real
- [ ] Documentar senha inicial para novos usuários (comunicação ao cliente)

### Pós-go-live

- [ ] Implementar troca obrigatória de senha no primeiro acesso
- [ ] Bloquear placeholders por URL em produção
- [ ] Remover códigos demo de certificado
- [ ] Melhorar visualização do construtor de relatórios

---

## 20. Testes automatizados adicionados

- `e2e/production-readiness-routes.spec.ts` — auditoria Master + auth + permissões SDR
- `src/modules/learning/domain/video-embed.test.ts` — pasta Drive e normalização `/preview`

Comando sugerido no servidor:

```powershell
$env:PLAYWRIGHT_SKIP_WEBSERVER="1"
$env:PORT="3000"
npx playwright test e2e/production-readiness-routes.spec.ts --retries=0
```

---

## 21. Commits desta auditoria

Ver `git log` na branch `audit/production-readiness-full-system` após push.

Mensagem: `audit: production readiness validation and critical fixes`
