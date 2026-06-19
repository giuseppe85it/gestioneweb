' Avvia il watchdog dell'Archivista in finestra COMPLETAMENTE nascosta.
' Usato come azione dell'operazione pianificata "Archivista IA".
Dim sh, fso, here, ps1, cmd
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
ps1  = here & "\archivista-watchdog.ps1"
cmd  = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """"
' 0 = finestra nascosta, False = non attendere la fine.
sh.Run cmd, 0, False
