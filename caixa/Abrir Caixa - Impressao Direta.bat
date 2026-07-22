@echo off
set "APP_PATH=%~dp0index.html"
set "APP_URL_PATH=%APP_PATH:\=/%"
set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "CHROME_PROFILE=%~dp0chrome-impressao-direta"

if exist "%CHROME_EXE%" (
  start "" "%CHROME_EXE%" --user-data-dir="%CHROME_PROFILE%" --kiosk --kiosk-printing --disable-print-preview --app="file:///%APP_URL_PATH%"
) else (
  start "" chrome.exe --user-data-dir="%CHROME_PROFILE%" --kiosk --kiosk-printing --disable-print-preview --app="file:///%APP_URL_PATH%"
)
