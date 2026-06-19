# Spegne l'AVVIO AUTOMATICO: disattiva il task pianificato e ferma il processo
# attualmente in esecuzione. Da qui in poi l'Archivista NON riparte al login
# finche' non lo riattivi (archivista-enable.ps1 o tasto "Riattiva avvio").
try {
  Disable-ScheduledTask -TaskName 'Archivista IA' -ErrorAction Stop | Out-Null
  "Avvio automatico DISATTIVATO."
} catch {
  "Errore disattivazione task: $($_.Exception.Message)"
}
& (Join-Path $PSScriptRoot 'archivista-stop.ps1') | Out-Null
