# Resolve raiz de instalação Bússola (C:\ ou D:\).
# Prioridade: $env:BUSSOLA_ROOT > C:\Bussola > D:\Bussola
function Get-BussolaRoot {
  if ($env:BUSSOLA_ROOT -and (Test-Path $env:BUSSOLA_ROOT)) {
    return $env:BUSSOLA_ROOT.TrimEnd('\', '/')
  }
  if (Test-Path "C:\Bussola") { return "C:\Bussola" }
  if (Test-Path "D:\Bussola") { return "D:\Bussola" }
  return "C:\Bussola"
}
