# Registra il protocollo personale "archivista://" per l'utente corrente (HKCU,
# nessun privilegio di amministratore). Cosi' i tasti dell'app web possono
# avviare/riavviare il backend con un click, anche quando e' completamente spento.
#
# Idempotente: puoi rieseguirlo senza problemi. Per rimuovere: archivista-protocol-unregister.ps1

$handler = Join-Path $PSScriptRoot 'archivista-protocol.vbs'
if (-not (Test-Path $handler)) {
  Write-Error "Handler non trovato: $handler"
  exit 1
}

$base = 'HKCU:\Software\Classes\archivista'
$cmdKey = Join-Path $base 'shell\open\command'

New-Item -Path $base -Force | Out-Null
Set-ItemProperty -Path $base -Name '(default)'    -Value 'URL:Archivista Protocol'
Set-ItemProperty -Path $base -Name 'URL Protocol' -Value ''

New-Item -Path $cmdKey -Force | Out-Null
$value = 'wscript.exe "' + $handler + '" "%1"'
Set-ItemProperty -Path $cmdKey -Name '(default)' -Value $value

"Protocollo 'archivista://' registrato per l'utente corrente."
"Handler: $handler"
"Comando: $value"
