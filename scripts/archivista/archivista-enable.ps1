# Riattiva l'AVVIO AUTOMATICO al login e avvia subito l'Archivista.
try {
  Enable-ScheduledTask -TaskName 'Archivista IA' -ErrorAction Stop | Out-Null
  "Avvio automatico RIATTIVATO."
} catch {
  "Errore riattivazione task: $($_.Exception.Message)"
}
Start-ScheduledTask -TaskName 'Archivista IA'
"Archivista avviato."
