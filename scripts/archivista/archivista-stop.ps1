# Ferma SUBITO l'Archivista: prima il watchdog (cosi' non riavvia node),
# poi il processo del backend in ascolto sulla porta 4310.
# NB: non disabilita l'avvio automatico al prossimo login.
#     Per quello usa:  Disable-ScheduledTask -TaskName 'Archivista IA'

$watchdogs = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*archivista-watchdog.ps1*' }
foreach ($w in $watchdogs) {
  Stop-Process -Id $w.ProcessId -Force -ErrorAction SilentlyContinue
  "Watchdog fermato (PID $($w.ProcessId))"
}

$conn = Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
  $pid4310 = ($conn.OwningProcess | Select-Object -First 1)
  Stop-Process -Id $pid4310 -Force -ErrorAction SilentlyContinue
  "Backend fermato (PID $pid4310)"
} else {
  "Backend non era in ascolto sulla 4310."
}
