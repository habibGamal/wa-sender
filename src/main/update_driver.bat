@echo off
SET arg1=%1
echo Updating to version %arg1% ...
:: Check for administrative privileges
net session >nul 2>&1
if %errorlevel% == 0 (
    echo Running with administrative privileges
    :: Your code here
    mkdir  C:\chromedriver
    curl -o C:\chromedriver\chromedriver.zip "https://storage.googleapis.com/chrome-for-testing-public/%arg1%/win64/chromedriver-win64.zip"
    tar -xzf C:\chromedriver\chromedriver.zip -C C:\chromedriver\
    pause
) else (
    echo Requesting administrative privileges...
    :: Restart the script with admin rights
    powershell -Command "Start-Process cmd -ArgumentList '/c %~f0 %1' -Verb runAs" >nul 2>&1
    exit /b
)
