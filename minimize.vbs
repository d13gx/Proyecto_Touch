Set objShell = CreateObject("WScript.Shell") 
Set oShell = CreateObject("Shell.Application") 
WScript.Sleep 2000 
objShell.AppActivate "Django API Server" 
WScript.Sleep 500 
objShell.SendKeys "% n" 
WScript.Sleep 500 
objShell.AppActivate "Node.js API Server" 
WScript.Sleep 500 
objShell.SendKeys "% n" 
WScript.Sleep 500 
objShell.AppActivate "React Frontend" 
WScript.Sleep 500 
objShell.SendKeys "% n" 
