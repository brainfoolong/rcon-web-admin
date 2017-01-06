@echo off
rem Start the server on windows
where /q node
if errorlevel 1 (
    echo Node.js is not installed globally. Cmd 'node' not available.
    exit /B
) else (
    echo Starting node server... Kill with CTRL+C or close window
    node %~dp0\..\src\main.js start
)