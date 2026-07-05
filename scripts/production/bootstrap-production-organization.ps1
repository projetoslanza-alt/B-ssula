#Requires -Version 5.1
<#
.SYNOPSIS
    Cria organização adicional em produção (idempotente).
#>

$ErrorActionPreference = "Stop"

if ($env:APP_ENV -ne "production") {
    Write-Host "APP_ENV deve ser production." -ForegroundColor Red
    exit 1
}

if ($env:PRODUCTION_CONFIRMATION -ne "CRIAR_ORGANIZACAO_PRODUCAO") {
    Write-Host 'Defina PRODUCTION_CONFIRMATION=CRIAR_ORGANIZACAO_PRODUCAO' -ForegroundColor Red
    exit 1
}

$required = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PRODUCTION_ORGANIZATION_NAME",
    "PRODUCTION_ORGANIZATION_SLUG",
    "PRODUCTION_ADMIN_EMAIL"
)

foreach ($name in $required) {
    if (-not (Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue)?.Value) {
        Write-Host "Variável obrigatória ausente: $name" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  NOVA ORGANIZAÇÃO — PRODUÇÃO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Organização: $($env:PRODUCTION_ORGANIZATION_NAME) ($($env:PRODUCTION_ORGANIZATION_SLUG))"
Write-Host "Admin:       $($env:PRODUCTION_ADMIN_EMAIL)"
Write-Host ""

$confirm = Read-Host "Digite SIM para continuar"
if ($confirm -ne "SIM") {
    Write-Host "Operação cancelada."
    exit 1
}

$AppDir = if (Test-Path "D:\Bussola\app") { "D:\Bussola\app" } else { Get-Location }
Set-Location $AppDir

npx tsx scripts/production/bootstrap-production-organization.ts
exit $LASTEXITCODE
