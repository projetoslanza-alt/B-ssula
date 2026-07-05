# Bússola — Guia de Produção no Windows Server

**Para:** Guilherme (operador do servidor)  
**Objetivo:** Subir a Bússola em produção econômica usando Windows Server Azure + Supabase.

> Este guia **não faz deploy automaticamente**. Siga as fases na ordem.

---

## Visão geral

| Onde | O que roda |
|------|------------|
| **Windows Server Azure** | Aplicação Next.js (porta 3000 interna) |
| **Caddy** | HTTPS público (portas 80/443) |
| **Supabase Cloud** | Banco, login, arquivos, segurança (RLS) |

Você **não** precisa instalar PostgreSQL no Windows.

---

## Fase 1 — Pedir para quem tem acesso à Azure

- [ ] VM Windows Server criada e ligada
- [ ] Domínio (ex: `bussola.empresa.com.br`) apontando para o IP da VM
- [ ] Portas 80 e 443 abertas
- [ ] Porta 3000 **fechada** para internet
- [ ] Acesso RDP (3389) restrito

---

## Fase 2 — Instalar no Windows

Conecte via RDP e instale:

1. **Node.js 20** — https://nodejs.org/
2. **Git** — https://git-scm.com/download/win
3. **Caddy** — extrair para `C:\Caddy\` (ver `caddy-nssm-windows.md`)
4. **NSSM** — extrair para `C:\nssm\` (ver `caddy-nssm-windows.md`)

Verifique no PowerShell:

```powershell
node -v
npm -v
git --version
```

---

## Fase 3 — Criar no Supabase

1. Crie um projeto **novo** chamado algo como `bussola-producao`
2. Anote: URL, anon key, service role key
3. Aplique as migrations (ver `supabase-production-setup.md`)
4. Configure Auth URLs com seu domínio HTTPS
5. **Não** rode seed nem fixtures de teste

---

## Fase 4 — Preencher `.env.production`

```powershell
mkdir D:\Bussola\app -Force
mkdir D:\Bussola\shared\logs -Force
cd D:\Bussola\app
git clone URL_DO_REPOSITORIO .
```

Copie `docs/production/env.production.example` para `.env.production` e preencha:

- `APP_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://seudominio.com.br`
- Credenciais Supabase
- Dados do bootstrap admin

---

## Fase 5 — Subir o app localmente (teste)

```powershell
cd D:\Bussola\app
npm ci
npm run production:check
npm run build

# Carregar variáveis do .env.production e iniciar
npm run start
```

Abra `http://localhost:3000/api/health` — deve retornar `"environment": "production"`.

---

## Fase 6 — Colocar HTTPS (Caddy)

1. Copie `docs/production/Caddyfile.example` para `C:\Caddy\Caddyfile`
2. Troque `seudominio.com.br` pelo domínio real
3. Teste: `cd C:\Caddy; .\caddy.exe run --config Caddyfile`
4. Acesse `https://seudominio.com.br`

---

## Fase 7 — Instalar como serviço (NSSM)

Instale dois serviços:

- **BussolaApp** — Next.js na porta 3000
- **Caddy** — proxy HTTPS

Comandos completos em `docs/production/caddy-nssm-windows.md`.

---

## Fase 8 — Criar o admin

### Passo A — Supabase Auth Dashboard

Crie o usuário admin manualmente (e-mail + senha forte).

### Passo B — Bootstrap

```powershell
$env:APP_ENV="production"
$env:PRODUCTION_CONFIRMATION="CRIAR_ADMIN_PRODUCAO"
# ... demais variáveis (ver env.production.example)

.\scripts\production\bootstrap-production-admin.ps1
```

### Passo C — Grupos

```powershell
$env:PRODUCTION_CONFIRMATION="PROVISIONAR_GRUPOS_PRODUCAO"
$env:PRODUCTION_TENANT_SLUG="slug-da-empresa"
npm run production:access-groups
```

---

## Fase 9 — Criar usuários pela plataforma

1. Acesse `https://seudominio.com.br/login`
2. Entre como admin
3. Vá em **Administração → Usuários → Novo**
4. Preencha nome, e-mail, grupo (Master/Gerente/SDR/Closer)
5. Ajuste permissões em **Matriz de permissões** se necessário

---

## Fase 10 — Validar tudo

```powershell
.\scripts\production\health-check.ps1 -Domain "https://seudominio.com.br"
```

Marque o checklist em `docs/production/go-live-checklist.md`.

Teste manualmente: Chamados, Conversa de Norte, Universidade, Relatórios, logout.

---

## Fase 11 — Atualizar depois

Quando houver nova versão no Git:

```powershell
cd D:\Bussola\app
# 1. Aplicar migrations no Supabase (se houver)
# 2. Rodar deploy
.\scripts\production\deploy-windows.ps1
```

---

## Problemas comuns

| Sintoma | O que fazer |
|---------|-------------|
| Página não abre | Verificar se Caddy e BussolaApp estão rodando (`nssm status`) |
| Erro de login | Conferir Site URL no Supabase |
| "Acesso pendente" | Rodar `production:access-groups` e vincular admin ao Master |
| Health com ambiente errado | Reiniciar serviço com `APP_ENV=production` |

---

## Documentos relacionados

| Documento | Conteúdo |
|-----------|----------|
| `azure-windows-supabase-runbook.md` | Runbook técnico completo |
| `supabase-production-setup.md` | Configuração Supabase |
| `caddy-nssm-windows.md` | Caddy + NSSM detalhado |
| `organizations-production.md` | Criar empresas adicionais |
| `go-live-checklist.md` | Checklist final |
| `production-readiness-audit.md` | Auditoria técnica |

---

**Veredito desta preparação:** PRONTO PARA REVISÃO DO RUNBOOK DE PRODUÇÃO

O próximo passo é executar este guia no servidor real, com aprovação para merge na `main`.
