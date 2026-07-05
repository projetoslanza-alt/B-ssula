#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap do administrador inicial em produção.

.DESCRIPTION
    Pré-requisito: usuário já criado manualmente no Supabase Auth Dashboard.
    O script localiza o usuário e cria organização, vínculo e papéis.

.NOTES
    Exige confirmação explícita para evitar execução acidental.
#>

$ErrorActionPreference = "Stop"

$required = @(
    "APP_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BOOTSTRAP_ADMIN_EMAIL",
    "BOOTSTRAP_ADMIN_NAME",
    "BOOTSTRAP_ORGANIZATION_NAME",
    "BOOTSTRAP_ORGANIZATION_SLUG",
    "PRODUCTION_CONFIRMATION"
)

foreach ($name in $required) {
    if (-not (Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue)?.Value) {
        Write-Host "Variável obrigatória ausente: $name" -ForegroundColor Red
        exit 1
    }
}

if ($env:APP_ENV -ne "production") {
    Write-Host "APP_ENV deve ser production." -ForegroundColor Red
    exit 1
}

if ($env:PRODUCTION_CONFIRMATION -ne "CRIAR_ADMIN_PRODUCAO") {
    Write-Host 'Defina PRODUCTION_CONFIRMATION=CRIAR_ADMIN_PRODUCAO' -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  BOOTSTRAP ADMIN — PRODUÇÃO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "E-mail admin:      $($env:BOOTSTRAP_ADMIN_EMAIL)"
Write-Host "Organização:       $($env:BOOTSTRAP_ORGANIZATION_NAME)"
Write-Host "Slug:              $($env:BOOTSTRAP_ORGANIZATION_SLUG)"
Write-Host "Supabase URL:      $($env:NEXT_PUBLIC_SUPABASE_URL)"
Write-Host ""
Write-Host "O usuário DEVE existir no Supabase Auth antes de continuar."
Write-Host ""

$confirm = Read-Host "Digite SIM para continuar"
if ($confirm -ne "SIM") {
    Write-Host "Operação cancelada."
    exit 1
}

$AppDir = if (Test-Path "D:\Bussola\app") { "D:\Bussola\app" } else { Get-Location }
Set-Location $AppDir

npm run bootstrap:admin
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Bootstrap concluído. Próximos passos:" -ForegroundColor Green
Write-Host "  1. npm run production:access-groups (com PRODUCTION_TENANT_SLUG)"
Write-Host "  2. Login em /login"
Write-Host "  3. Validar /administracao/usuarios"
