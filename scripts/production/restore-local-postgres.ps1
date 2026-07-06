#Requires -Version 5.1
param([Parameter(Mandatory=$true)][string]$DumpFile)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $DumpFile)) { throw "Arquivo não encontrado: $DumpFile" }
Write-Host "Restaurando $DumpFile ..."
pg_restore -h localhost -U bussola_admin -d bussola_prod --clean --if-exists $DumpFile
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "Restore concluído."
