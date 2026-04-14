Option Explicit

Dim shell, fso, appDir, command, npmCmd

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
npmCmd = "npm.cmd"
command = "cmd /c cd /d """ & appDir & """ && " & npmCmd & " run electron-dev"

' Window style 0 hides the command prompt window.
shell.Run command, 0, False
