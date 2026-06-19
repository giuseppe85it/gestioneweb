# Archivista (backend IA interno) - watchdog con riavvio automatico.
# Avviato dall'operazione pianificata "Archivista IA" all'accesso a Windows,
# in finestra nascosta tramite archivista-launch-hidden.vbs.
#
# Cosa fa: avvia il server backend (porta 4310) e, se il processo si chiude
# per un errore, lo riavvia dopo qualche secondo. Gira finche' l'operazione
# pianificata non viene fermata o l'utente non esce da Windows.

$ErrorActionPreference = 'Continue'

# Root del progetto = due livelli sopra questa cartella (scripts/archivista).
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

# Risolvi node: prima dal PATH, altrimenti percorso standard di installazione.
$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeCmd) { $nodeCmd = 'C:\Program Files\nodejs\node.exe' }

$server = Join-Path $projectRoot 'backend\internal-ai\server\internal-ai-adapter.js'

# Log fuori dal repository, sempre scrivibile dall'utente.
$logDir = Join-Path $env:LOCALAPPDATA 'Archivista'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir 'archivista.log'

# Backoff anti crash-loop: parte da 3s, sale fino a 30s se i crash sono ravvicinati.
$delay = 3

while ($true) {
  $startedAt = Get-Date
  Add-Content -Path $logFile -Value ("[" + ($startedAt.ToString('yyyy-MM-dd HH:mm:ss')) + "] avvio backend Archivista ($nodeCmd)")

  try {
    & $nodeCmd $server *>> $logFile
  } catch {
    Add-Content -Path $logFile -Value ("[" + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + "] errore avvio: " + $_.Exception.Message)
  }

  # Se il processo e' rimasto su a lungo, azzera il backoff; altrimenti aumentalo.
  if ((New-TimeSpan -Start $startedAt -End (Get-Date)).TotalSeconds -ge 60) {
    $delay = 3
  } else {
    $delay = [Math]::Min($delay * 2, 30)
  }

  Add-Content -Path $logFile -Value ("[" + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + "] processo terminato, riavvio tra ${delay}s")
  Start-Sleep -Seconds $delay
}
