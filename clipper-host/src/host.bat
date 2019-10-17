@echo off

set LOG="%~dp0log.txt"

time /t >> %LOG%

node.exe "%~dp0index.js" %* 2>> %LOG%

echo %errorlevel% >> %LOG%
