$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Klyra Server.lnk")
$Shortcut.TargetPath = "C:\klyra\scripts\klyra-autostart.bat"
$Shortcut.WorkingDirectory = "C:\klyra"
$Shortcut.Save()
Write-Host "Startup shortcut created successfully!"
