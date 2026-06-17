<#
.SYNOPSIS
    Runs the FlowSpeak API backend.
    This script navigates to the API project directory, restores .NET dependencies,
    and then starts the application.
.DESCRIPTION
    Ensure you have the .NET 10 SDK installed and your environment variables
    (or appsettings.json) are configured correctly.
.NOTES
    File: run-demo.ps1
    Author: Gemini Code Assist
    Version: 1.0
#>

Write-Host "Starting FlowSpeak API..." -ForegroundColor Green

Push-Location "src/FlowSpeak.Api"
dotnet restore
dotnet run
Pop-Location
Write-Host "FlowSpeak API started. Press Ctrl+C to stop." -ForegroundColor Green