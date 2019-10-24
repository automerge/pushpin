  
@echo off

reg add HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.pushpin.pushpin /f /ve /t REG_SZ /d %~f1com.pushpin.pushpin.json
