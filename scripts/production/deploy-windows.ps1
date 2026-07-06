#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy seguro da aplicação Bússola no Windows Server.

.DESCRIPTION
    Atualiza o código, valida qualidade, reconstrói e reinicia o serviço BussolaApp.
    Não aplica migrations automaticamente — execute antes conforme runbook.

.NOTES
    Caminhos padrão: D:\Bussola\app, D:\Bussola\shared\logs
#>

$ErrorActionPreference = "Stop"

$AppDir = if (Test-Path "D:\Bussola\app") { "D:\Bussola\app" } else { "C:\Bussola\app" }
$LogDir = if (Test-Path "D:\Bussola\shared\logs") { "D:\Bussola\shared\logs" } else { "C:\Bussola\shared\logs" }
$LogFile = Join-Path $LogDir "deploy.log"
$ServiceName = "BussolaApp"
$HealthUrl = "http://localhost:3000/api/health"

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $line
    Write-Host $line
}

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )
    Write-Log "▶ $Label"
    & $Action
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "Falha em: $Label (exit $LASTEXITCODE)"
    }
}

try {
    Write-Log "=== Início do deploy Bússola ==="

    if (-not (Test-Path $AppDir)) {
        throw "Diretório da aplicação não encontrado: $AppDir"
    }

    Set-Location $AppDir

    Invoke-Step "Validar branch main" {
        $branch = git branch --show-current
        if ($branch -ne "main") {
            throw "Deploy exige branch main. Atual: $branch"
        }
    }

    Invoke-Step "git fetch origin" { git fetch origin }
    Invoke-Step "git pull --ff-only origin main" { git pull --ff-only origin main }
    Invoke-Step "npm ci" { npm ci }
    Invoke-Step "npm run typecheck" { npm run typecheck }
    Invoke-Step "npm run lint" { npm run lint }
    Invoke-Step "npm run test" { npm run test }
    Invoke-Step "npm run test:rls" { npm run test:rls }
    Invoke-Step "npm run build" { npm run build }

    $authProvider = $env:AUTH_PROVIDER
    $dbProvider = $env:DATABASE_PROVIDER
    if (-not $authProvider -and (Test-Path ".env.production")) {
        $envLines = Get-Content ".env.production" -ErrorAction SilentlyContinue
        foreach ($line in $envLines) {
            if ($line -match '^\s*AUTH_PROVIDER\s*=\s*(.+)\s*$') { $authProvider = $Matches[1].Trim().Trim('"').Trim("'") }
            if ($line -match '^\s*DATABASE_PROVIDER\s*=\s*(.+)\s*$') { $dbProvider = $Matches[1].Trim().Trim('"').Trim("'") }
        }
    }

    if ($dbProvider -eq "local_postgres") {
        Invoke-Step "npm run db:migrate:local-prod" { npm run db:migrate:local-prod }
    } else {
        Write-Log "ℹ Stack Supabase: rodar migrations conforme runbook (db push / SQL manual)."
    }

    if ($authProvider -eq "local") {
        Invoke-Step "npm run production:check --strict" { npm run production:check -- --strict }
    }

    Invoke-Step "Reiniciar serviço $ServiceName" {
        nssm restart $ServiceName
    }

    Write-Log "Aguardando 8 segundos para o serviço subir..."
    Start-Sleep -Seconds 8

    Invoke-Step "Health check local" {
        $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 30
        if ($response.StatusCode -ne 200) {
            throw "Health retornou status $($response.StatusCode)"
        }
        $body = $response.Content | ConvertFrom-Json
        if ($body.app -ne "bussola") {
            throw "Health não identificou app bussola"
        }
        Write-Log "Health OK — environment=$($body.environment)"
    }

    Write-Log "=== Deploy concluído com sucesso ==="
    exit 0
}
catch {
    Write-Log "ERRO: $($_.Exception.Message)"
    exit 1
}
