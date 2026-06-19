# Mostra lo stato dell'Archivista: operazione pianificata, processo in ascolto
# sulla porta 4310 e ultime righe di log.

$task = Get-ScheduledTask -TaskName 'Archivista IA' -ErrorAction SilentlyContinue
if ($task) { "Operazione pianificata 'Archivista IA': $($task.State)" }
else { "Operazione pianificata 'Archivista IA': NON registrata" }

$conn = Get-NetTCPConnection -LocalPort 4310 -State Listen -ErrorAction SilentlyContinue
if ($conn) { "Backend ATTIVO sulla porta 4310 (PID $($conn.OwningProcess | Select-Object -First 1))" }
else { "Backend NON attivo sulla porta 4310" }

$log = Join-Path $env:LOCALAPPDATA 'Archivista\archivista.log'
if (Test-Path $log) {
  ""
  "=== ultime 15 righe di log ($log) ==="
  Get-Content $log -Tail 15
}
