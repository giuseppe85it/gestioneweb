# Riavvia l'Archivista: ferma watchdog + backend, poi rilancia via task pianificato.
& (Join-Path $PSScriptRoot 'archivista-stop.ps1') | Out-Null
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName 'Archivista IA'
"Archivista riavviato."
