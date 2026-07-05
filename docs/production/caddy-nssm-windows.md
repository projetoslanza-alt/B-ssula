# Caddy + NSSM no Windows Server

Guia para expor a aplicação Next.js via HTTPS usando Caddy como proxy reverso.

## Pré-requisitos

- Windows Server com acesso administrador
- Domínio apontando para o IP público da VM
- Portas 80 e 443 liberadas no NSG/firewall Azure
- Aplicação respondendo em `http://localhost:3000`

## 1. Baixar Caddy

1. Acesse https://caddyserver.com/download
2. Baixe a versão Windows AMD64
3. Extraia `caddy.exe` para `C:\Caddy\caddy.exe`

## 2. Criar Caddyfile

Copie `docs/production/Caddyfile.example` para `C:\Caddy\Caddyfile`:

```
seudominio.com.br {
    reverse_proxy localhost:3000
}
```

Substitua `seudominio.com.br` pelo domínio real.

Teste manual:

```powershell
cd C:\Caddy
.\caddy.exe run --config Caddyfile
```

Acesse `https://seudominio.com.br` — deve mostrar a aplicação.

## 3. Instalar NSSM

1. Baixe NSSM de https://nssm.cc/download
2. Extraia para `C:\nssm\`
3. Adicione ao PATH ou use caminho completo

## 4. Serviço BussolaApp (Next.js)

```powershell
cd D:\Bussola\app

# Instalar dependências e build (primeira vez)
npm ci
npm run build

nssm install BussolaApp "C:\Program Files\nodejs\node.exe"
nssm set BussolaApp AppDirectory "D:\Bussola\app"
nssm set BussolaApp AppParameters "node_modules\next\dist\bin\next start -p 3000"
nssm set BussolaApp AppEnvironmentExtra "APP_ENV=production" "NODE_ENV=production"
nssm set BussolaApp AppStdout "D:\Bussola\shared\logs\bussola-stdout.log"
nssm set BussolaApp AppStderr "D:\Bussola\shared\logs\bussola-stderr.log"
nssm start BussolaApp
```

> Alternativa: carregar variáveis de `.env.production` via script wrapper.

Validar:

```powershell
Invoke-WebRequest http://localhost:3000/api/health
```

## 5. Serviço Caddy

```powershell
nssm install Caddy "C:\Caddy\caddy.exe"
nssm set Caddy AppDirectory "C:\Caddy"
nssm set Caddy AppParameters "run --config Caddyfile"
nssm set Caddy AppStdout "D:\Bussola\shared\logs\caddy-stdout.log"
nssm set Caddy AppStderr "D:\Bussola\shared\logs\caddy-stderr.log"
nssm start Caddy
```

## 6. Reiniciar serviços

```powershell
nssm restart BussolaApp
nssm restart Caddy
```

## 7. Validar

```powershell
.\scripts\production\health-check.ps1 -Domain "https://seudominio.com.br"
```

## Portas

| Porta | Status |
|-------|--------|
| 80 | Liberada (HTTP → HTTPS redirect pelo Caddy) |
| 443 | Liberada (HTTPS público) |
| 3000 | **Bloqueada** externamente (apenas localhost) |
| 3389 | Restrita (RDP apenas IPs autorizados) |
| 5432 | **Bloqueada** (Supabase é cloud) |

## Logs

- `D:\Bussola\shared\logs\bussola-stdout.log`
- `D:\Bussola\shared\logs\bussola-stderr.log`
- `D:\Bussola\shared\logs\caddy-stdout.log`
- `D:\Bussola\shared\logs\deploy.log`

## Alternativa: IIS

Se preferir IIS em vez de Caddy, configure URL Rewrite + ARR como proxy reverso para `localhost:3000`. O runbook principal usa Caddy por simplicidade de certificado automático.
