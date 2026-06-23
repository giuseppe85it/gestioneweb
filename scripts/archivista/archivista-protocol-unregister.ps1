# Rimuove il protocollo personale "archivista://" per l'utente corrente.
# Annulla quanto fatto da archivista-protocol-register.ps1.

$base = 'HKCU:\Software\Classes\archivista'
if (Test-Path $base) {
  Remove-Item -Path $base -Recurse -Force
  "Protocollo 'archivista://' rimosso."
} else {
  "Protocollo 'archivista://' non risultava registrato."
}
