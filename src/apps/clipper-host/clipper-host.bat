@echo off

set LOG="%~dp0log.txt"

time /t >> %LOG%

set ELECTRON_RUN_AS_NODE=1
"__NODE_PATH__" "%~dp0clipper-host.js" %* 2>> %LOG%

echo %errorlevel% >> %LOG%
