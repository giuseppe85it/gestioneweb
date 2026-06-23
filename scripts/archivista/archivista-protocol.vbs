' Handler del protocollo personale "archivista://" usato dai tasti dell'app web.
' Riceve come unico argomento l'URL invocato dal browser (es. "archivista://restart")
' e lancia lo script PowerShell corrispondente, in finestra nascosta.
'
' Per sicurezza accetta SOLO una lista chiusa di azioni: nessun comando arbitrario
' viene mai eseguito. Le azioni mappano 1:1 sugli script gia' presenti in questa cartella.

Option Explicit

Dim sh, fso, scriptDir, raw, action, scriptName, p, ps1, cmd
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

If WScript.Arguments.Count = 0 Then WScript.Quit 0

' Esempio di raw: "archivista://restart/"  ->  estrai "restart"
raw = LCase(WScript.Arguments(0))
p = InStr(raw, "://")
If p > 0 Then raw = Mid(raw, p + 3)
raw = Replace(raw, "/", "")
raw = Replace(raw, "\", "")
action = Trim(raw)

Select Case action
  Case "restart", "start" : scriptName = "archivista-restart.ps1"
  Case "stop"             : scriptName = "archivista-stop.ps1"
  Case "enable"           : scriptName = "archivista-enable.ps1"
  Case "disable"          : scriptName = "archivista-disable.ps1"
  Case Else               : WScript.Quit 0   ' azione sconosciuta: non fare nulla
End Select

ps1 = scriptDir & "\" & scriptName
If Not fso.FileExists(ps1) Then WScript.Quit 0

cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """"
' 0 = finestra nascosta, False = non attendere la fine.
sh.Run cmd, 0, False
