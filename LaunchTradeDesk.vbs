Option Explicit

Dim shell, fso, appDir, command, npmCmd

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
npmCmd = "npm.cmd"
' Starts Trade Desk, or brings forward the copy already running (see scripts\launch.cjs).
command = "cmd /c cd /d """ & appDir & """ && node scripts\launch.cjs"

' Window style 0 hides the command prompt window.
shell.Run command, 0, False
