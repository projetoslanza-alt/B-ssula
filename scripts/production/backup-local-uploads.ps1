#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$Source = "D:\Bussola\shared\uploads"
$BackupDir = "D:\Bussola\backups\uploads"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $BackupDir "uploads_$timestamp.zip"

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
Compress-Archive -Path $Source -DestinationPath $dest -Force
Write-Host "Backup uploads: $dest"
