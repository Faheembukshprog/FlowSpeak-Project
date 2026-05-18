Write-Host "Starting FlowSpeak Windows Setup..."

Write-Host "1. Restoring Backend Dependencies..."
Set-Location -Path "src\FlowSpeak.Api"
dotnet restore
try {
    dotnet tool install --global dotnet-ef 2>$null
} catch {}
dotnet ef database update
Set-Location -Path "..\.."

Write-Host "2. Restoring Frontend Dependencies..."
Set-Location -Path "flowspeak-ui"
npm install
Set-Location -Path ".."

Write-Host "Setup Complete!"
