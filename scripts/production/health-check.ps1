#Requires -Version 5.1
<#
.SYNOPSIS
    Valida saúde da aplicação Bússola em produção.

.PARAMETER Domain
    Domínio HTTPS público (opcional). Exemplo: seudominio.com.br
#>

param(
    [string]$Domain = $env:NEXT_PUBLIC_APP_URL
)

$ErrorActionPreference = "Stop"

function Test-HealthEndpoint {
    param(
        [string]$Url,
        [bool]$RequireProduction = $false
    )

    Write-Host "Verificando: $Url"
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30

    if ($response.StatusCode -ne 200) {
        throw "Status HTTP $($response.StatusCode) em $Url"
    }

    $body = $response.Content | ConvertFrom-Json

    if ($body.status -ne "ok") { throw "status != ok" }
    if ($body.app -ne "bussola") { throw "app != bussola" }

    if ($RequireProduction -and $body.environment -ne "production") {
        throw "environment esperado: production, recebido: $($body.environment)"
    }

    if ($response.Content -match "service_role|SUPABASE_SERVICE_ROLE") {
        throw "Resposta contém possível segredo"
    }

    Write-Host "  OK — environment=$($body.environment)"
}

try {
    Test-HealthEndpoint -Url "http://localhost:3000/api/health" -RequireProduction $true

    if ($Domain) {
        $httpsUrl = $Domain.TrimEnd("/") + "/api/health"
        if ($httpsUrl -notmatch "^https?://") {
            $httpsUrl = "https://" + $httpsUrl
        }
        Test-HealthEndpoint -Url $httpsUrl -RequireProduction $true
    }

    Write-Host "`nHealth check aprovado."
    exit 0
}
catch {
    Write-Host "FALHA: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
