#Requires -Version 5.1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\bussola-root.ps1"
$Root = Get-BussolaRoot
$BackupDir = Join-Path $Root "backups\postgres"
$LogFile = Join-Path $Root "shared\logs\backup-postgres.log"
$RetentionDays = 14

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
$logDir = Split-Path $LogFile -Parent
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $BackupDir "bussola_prod_$timestamp.dump"

Write-Host "Backup PostgreSQL (root: $Root) -> $file"
pg_dump -Fc -h localhost -U bussola_backup -d bussola_prod -f $file
if ($LASTEXITCODE -ne 0) { exit 1 }

Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] OK $file"

Get-ChildItem $BackupDir -Filter "*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  Remove-Item -Force

Write-Host "Backup concluído."
