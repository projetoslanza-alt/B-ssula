#Requires -Version 5.1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\bussola-root.ps1"
$Root = Get-BussolaRoot
$Source = Join-Path $Root "shared\uploads"
$BackupDir = Join-Path $Root "backups\uploads"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $BackupDir "uploads_$timestamp.zip"

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
if (-not (Test-Path $Source)) {
  Write-Error "Pasta de uploads não encontrada: $Source (BUSSOLA_ROOT=$Root)"
}
Compress-Archive -Path $Source -DestinationPath $dest -Force
Write-Host "Backup uploads (root: $Root): $dest"
