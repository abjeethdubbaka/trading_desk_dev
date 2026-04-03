Option Explicit

Dim shell, fso, appDir, electronExe, command

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
electronExe = fso.BuildPath(appDir, "node_modules\electron\dist\electron.exe")

If fso.FileExists(electronExe) Then
  command = """" & electronExe & """ """ & appDir & """"
Else
  command = "cmd /c cd /d """ & appDir & """ && npm run electron"
End If

' Window style 0 hides the command prompt window.
shell.Run command, 0, False
